// Serveur de Polyglotte : sert l'application et expose deux routes d'IA.
//   POST /api/generate-unit  → prépare une leçon (mise en cache sur disque,
//                               partagée par tous les apprenants)
//   POST /api/tutor          → réplique de Bao, le professeur IA
// Sans clé d'API, l'application fonctionne quand même : seules ces deux
// routes répondent « non configuré » et l'interface le signale.

import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { LANGUAGES, customLanguage } from '../src/languages.js';
import { findUnit, findLevel } from '../src/curriculum.js';
import { validateUnit } from '../src/generator.js';
import { validateTutorReply, trimHistory } from '../src/tutor.js';
import { generateUnit, tutorReply, isConfigured } from './claude.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = path.resolve(process.env.POLYGLOTTE_CACHE_DIR ?? path.join(ROOT, '.cache'));
const PORT = Number(process.env.PORT ?? 8080);
const MAX_BODY = 32 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};
const PUBLIC = [/^\/index\.html$/, /^\/styles\.css$/, /^\/sw\.js$/, /^\/manifest\.webmanifest$/, /^\/icons\/[\w.-]+$/, /^\/src\/[\w/.-]+\.js$/];

// ---------- Limitation de débit (par adresse IP, en mémoire) ----------

const LIMITS = { unit: { max: 20, windowMs: 60 * 60 * 1000 }, tutor: { max: 150, windowMs: 60 * 60 * 1000 } };
const hits = new Map();

export function allow(kind, ip, now = Date.now()) {
  const { max, windowMs } = LIMITS[kind];
  const key = `${kind}:${ip}`;
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  return true;
}

// ---------- Utilitaires ----------

function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  res.end(data);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('Requête trop volumineuse.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('JSON invalide.'), { status: 400 });
  }
}

// La langue est déterminée côté serveur : catalogue connu, ou langue libre
// reconstruite à partir de son nom (jamais d'identifiant arbitraire du client).
export function resolveLanguage(input) {
  const known = LANGUAGES.find((l) => l.id === input?.id);
  if (known) return known;
  const custom = customLanguage(input?.name ?? '');
  if (!custom || custom.id !== input?.id) return null;
  return custom;
}

function clientIp(req) {
  return req.socket.remoteAddress ?? 'inconnu';
}

function apiError(err) {
  if (err instanceof Anthropic.RateLimitError) return [429, 'Le professeur est très sollicité. Réessayez dans une minute.'];
  if (err instanceof Anthropic.AuthenticationError) return [503, 'Clé d’API invalide côté serveur.'];
  if (err instanceof Anthropic.APIConnectionError) return [502, 'Le service d’IA est injoignable pour le moment.'];
  if (err instanceof Anthropic.APIError) return [502, 'Le service d’IA a rencontré une erreur.'];
  return [err.status ?? 500, err.message || 'Erreur inattendue.'];
}

// ---------- Génération de leçons (avec cache disque) ----------

const inflight = new Map();

async function handleUnit(req, res) {
  const body = await readJson(req);
  const language = resolveLanguage(body.language);
  const unit = findUnit(body.unitId);
  if (!language) return send(res, 400, { error: 'bad-language', message: 'Nom de langue invalide.' });
  if (!unit) return send(res, 400, { error: 'bad-unit', message: 'Unité inconnue.' });

  const file = path.join(CACHE_DIR, 'units', language.id, `${unit.id}.json`);
  try {
    return send(res, 200, { unit: JSON.parse(await readFile(file, 'utf8')), cached: true });
  } catch {
    /* pas encore en cache */
  }
  if (!isConfigured()) return send(res, 503, { error: 'not-configured' });
  if (!allow('unit', clientIp(req))) return send(res, 429, { message: 'Beaucoup de leçons préparées en peu de temps : réessayez dans un moment.' });

  const key = `${language.id}/${unit.id}`;
  if (!inflight.has(key)) {
    inflight.set(
      key,
      (async () => {
        const raw = await generateUnit({ language, level: findLevel(unit.levelId), unit });
        const valid = validateUnit(raw, { langId: language.id, unitId: unit.id });
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, JSON.stringify(valid));
        return valid;
      })().finally(() => inflight.delete(key)),
    );
  }
  send(res, 200, { unit: await inflight.get(key) });
}

// ---------- Conversation avec Bao ----------

async function handleTutor(req, res) {
  const body = await readJson(req);
  const language = resolveLanguage(body.language);
  const level = findLevel(body.levelId) ?? findLevel('a1');
  const unit = body.unitId ? findUnit(body.unitId) : null;
  if (!language) return send(res, 400, { error: 'bad-language', message: 'Nom de langue invalide.' });
  if (!Array.isArray(body.history)) return send(res, 400, { message: 'Historique invalide.' });
  if (!isConfigured()) return send(res, 503, { error: 'not-configured' });
  if (!allow('tutor', clientIp(req))) return send(res, 429, { message: 'Faisons une petite pause : réessayez dans quelques minutes.' });

  const raw = await tutorReply({ language, level, unit, history: trimHistory(body.history) });
  send(res, 200, validateTutorReply(raw));
}

// ---------- Fichiers statiques ----------

async function serveStatic(req, res) {
  let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/') url = '/index.html';
  if (!PUBLIC.some((re) => re.test(url)) || url.includes('..')) return send(res, 404, 'Introuvable');
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT + path.sep)) return send(res, 404, 'Introuvable');
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error();
    send(res, 200, await readFile(file), { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
  } catch {
    send(res, 404, 'Introuvable');
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://x');
      if (pathname === '/api/generate-unit' || pathname === '/api/tutor') {
        if (req.method !== 'POST') return send(res, 405, { message: 'Méthode non autorisée.' });
        return await (pathname === '/api/tutor' ? handleTutor(req, res) : handleUnit(req, res));
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Méthode non autorisée');
      return await serveStatic(req, res);
    } catch (err) {
      const [status, message] = apiError(err);
      if (status >= 500) console.error(err);
      if (!res.headersSent) send(res, status, { message });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().listen(PORT, () => {
    console.log(`Polyglotte : http://localhost:${PORT}`);
    console.log(isConfigured() ? 'IA activée (leçons générées et professeur Bao).' : 'IA désactivée : définissez ANTHROPIC_API_KEY pour l’activer.');
  });
}

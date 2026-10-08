// Serveur de Polyglotte : sert l'application et expose ses routes.
//   POST /api/generate-unit  → prépare une leçon dans la langue de base de
//                               l'apprenant (cache disque partagé)
//   POST /api/tutor          → réplique de Bao, le professeur IA
//   GET  /api/ui/:langue     → interface traduite par l'IA (cache disque)
//   GET  /api/geo            → pays de connexion, si l'hébergeur le fournit
// Sans clé d'API, l'application fonctionne quand même : les routes d'IA
// répondent « non configuré » et l'interface le signale.

import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { LANGUAGES, customLanguage, findLanguage } from '../src/languages.js';
import { isBaseLanguage } from '../src/locale.js';
import { CATALOG, CATALOG_VERSION, cleanTable, BUILTIN, N } from '../src/i18n.js';
import EN from '../src/i18n/en.js';
import { findUnit, findLevel, findSector, findGoal } from '../src/curriculum.js';
import { validateUnit } from '../src/generator.js';
import { validateTutorReply, trimHistory } from '../src/tutor.js';
import { generateUnit, tutorReply, translateUi, isConfigured } from './claude.mjs';

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
const PUBLIC = [/^\/index\.html$/, /^\/styles\.css$/, /^\/sw\.js$/, /^\/manifest\.webmanifest$/, /^\/icons\/[\w.-]+$/, /^\/src\/[\w/.-]+\.js$/, /^\/vendor\/[\w.-]+\.js$/];

// ---------- Limitation de débit (par adresse IP, en mémoire) ----------

const LIMITS = { unit: { max: 20, windowMs: 60 * 60 * 1000 }, tutor: { max: 150, windowMs: 60 * 60 * 1000 }, ui: { max: 5, windowMs: 60 * 60 * 1000 } };
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
    if (size > MAX_BODY) throw Object.assign(new Error(N('Requête trop volumineuse.')), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error(N('JSON invalide.')), { status: 400 });
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

// Langue de base : une langue du catalogue (le français par défaut, pour les
// clients de la première version).
export function resolveBase(id) {
  if (id === undefined || id === null || id === '') return findLanguage('fr');
  return isBaseLanguage(id) ? findLanguage(id) : null;
}

function clientIp(req) {
  return req.socket.remoteAddress ?? 'inconnu';
}

function apiError(err) {
  if (err instanceof Anthropic.RateLimitError) return [429, N('Le professeur est très sollicité. Réessayez dans une minute.')];
  if (err instanceof Anthropic.AuthenticationError) return [503, N('Clé d’API invalide côté serveur.')];
  if (err instanceof Anthropic.APIConnectionError) return [502, N('Le service d’IA est injoignable pour le moment.')];
  if (err instanceof Anthropic.APIError) return [502, N('Le service d’IA a rencontré une erreur.')];
  return [err.status ?? 500, err.message || N('Erreur inattendue.')];
}

// ---------- Génération de leçons (avec cache disque) ----------

const inflight = new Map();

async function handleUnit(req, res) {
  const body = await readJson(req);
  const language = resolveLanguage(body.language);
  const base = resolveBase(body.base);
  const unit = findUnit(body.unitId);
  if (!language) return send(res, 400, { error: 'bad-language', message: N('Nom de langue invalide.') });
  if (!base || base.id === language.id) return send(res, 400, { error: 'bad-base', message: N('Langue de base invalide.') });
  if (!unit) return send(res, 400, { error: 'bad-unit', message: N('Unité inconnue.') });
  // Seules les unités « Mon métier » dépendent du secteur (liste fermée).
  const sector = unit.track === 'metier' ? findSector(body.sector) : null;
  if (unit.track === 'metier' && body.sector && !sector) return send(res, 400, { error: 'bad-sector', message: N('Secteur inconnu.') });

  const suffix = `${unit.track === 'metier' ? `--${sector?.id ?? 'general'}` : ''}${base.id === 'fr' ? '' : `~${base.id}`}`;
  const file = path.join(CACHE_DIR, 'units', language.id, `${unit.id}${suffix}.json`);
  try {
    return send(res, 200, { unit: JSON.parse(await readFile(file, 'utf8')), cached: true });
  } catch {
    /* pas encore en cache */
  }
  if (!isConfigured()) return send(res, 503, { error: 'not-configured' });
  if (!allow('unit', clientIp(req))) return send(res, 429, { message: N('Beaucoup de leçons préparées en peu de temps : réessayez dans un moment.') });

  const key = `${language.id}/${unit.id}/${sector?.id ?? ''}/${base.id}`;
  if (!inflight.has(key)) {
    inflight.set(
      key,
      (async () => {
        const raw = await generateUnit({ language, base, level: findLevel(unit.levelId), unit, sector });
        const valid = validateUnit(raw, { langId: language.id, unitId: unit.id, sector: sector?.id ?? (unit.track === 'metier' ? 'general' : null), base: base.id });
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
  const base = resolveBase(body.base);
  const level = findLevel(body.levelId) ?? findLevel('a1');
  const unit = body.unitId ? findUnit(body.unitId) : null;
  if (!language) return send(res, 400, { error: 'bad-language', message: N('Nom de langue invalide.') });
  if (!base) return send(res, 400, { error: 'bad-base', message: N('Langue de base invalide.') });
  if (!Array.isArray(body.history)) return send(res, 400, { message: N('Historique invalide.') });
  if (!isConfigured()) return send(res, 503, { error: 'not-configured' });
  if (!allow('tutor', clientIp(req))) return send(res, 429, { message: N('Faisons une petite pause : réessayez dans quelques minutes.') });

  const profile = { sector: findSector(body.sector), goal: findGoal(body.goal) };
  const raw = await tutorReply({ language, base, level, unit, profile, history: trimHistory(body.history) });
  send(res, 200, validateTutorReply(raw));
}

// ---------- Interface traduite ----------

const UI_BATCH = 90;
const uiInflight = new Map();

// Traduit tout le catalogue par lots en parallèle ; une phrase mal traduite
// (variable ou balise perdue) est simplement écartée : l'anglais la remplace.
async function translateCatalog(base) {
  const batches = [];
  for (let i = 0; i < CATALOG.length; i += UI_BATCH) batches.push(CATALOG.slice(i, i + UI_BATCH));
  const results = await Promise.all(
    batches.map(async (batch) => {
      const out = await translateUi({ base, entries: batch.map((fr) => ({ fr, en: EN[fr] })) });
      return out.length === batch.length ? batch.map((fr, i) => [fr, out[i]]) : [];
    }),
  );
  return cleanTable(Object.fromEntries(results.flat()));
}

async function handleUi(req, res, langId) {
  const base = resolveBase(langId);
  if (!base || !langId) return send(res, 400, { error: 'bad-language', message: N('Langue de base invalide.') });
  const headers = { 'cache-control': 'public, max-age=86400' };
  if (base.id === 'fr') return send(res, 200, { version: CATALOG_VERSION, strings: Object.fromEntries(CATALOG.map((s) => [s, s])) }, headers);
  if (base.id === 'en') return send(res, 200, { version: CATALOG_VERSION, strings: EN }, headers);
  // Traductions livrées avec l'application : pas besoin d'IA.
  if (BUILTIN.includes(base.id)) return send(res, 200, { version: CATALOG_VERSION, strings: cleanTable((await import(`../src/i18n/${base.id}.js`)).default) }, headers);

  const file = path.join(CACHE_DIR, 'ui', `${base.id}-${CATALOG_VERSION}.json`);
  try {
    return send(res, 200, { version: CATALOG_VERSION, strings: JSON.parse(await readFile(file, 'utf8')) }, headers);
  } catch {
    /* pas encore traduite */
  }
  if (!isConfigured()) return send(res, 503, { error: 'not-configured' });
  if (!uiInflight.has(base.id) && !allow('ui', clientIp(req))) return send(res, 429, { message: N('Beaucoup de demandes en peu de temps : réessayez dans un moment.') });

  if (!uiInflight.has(base.id)) {
    uiInflight.set(
      base.id,
      (async () => {
        const strings = await translateCatalog(base);
        if (Object.keys(strings).length < CATALOG.length * 0.8) throw Object.assign(new Error(N('Traduction incomplète.')), { status: 502 });
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, JSON.stringify(strings));
        return strings;
      })().finally(() => uiInflight.delete(base.id)),
    );
  }
  send(res, 200, { version: CATALOG_VERSION, strings: await uiInflight.get(base.id) }, headers);
}

// ---------- Pays de connexion ----------

// Pays fourni par l'hébergeur ou le CDN, s'il y en a un devant le serveur.
const GEO_HEADERS = ['cf-ipcountry', 'x-vercel-ip-country', 'cloudfront-viewer-country', 'x-appengine-country', 'fastly-geo-country', 'x-country-code'];

export function geoCountry(headers) {
  for (const h of GEO_HEADERS) {
    const value = String(headers[h] ?? '').toUpperCase();
    if (/^[A-Z]{2}$/.test(value) && value !== 'XX' && value !== 'ZZ') return value;
  }
  return null;
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
      if (pathname === '/api/geo') return send(res, 200, { country: geoCountry(req.headers) }, { 'cache-control': 'no-store' });
      const ui = pathname.match(/^\/api\/ui\/([\w-]{1,12})$/);
      if (ui) {
        if (req.method !== 'GET') return send(res, 405, { message: N('Méthode non autorisée.') });
        return await handleUi(req, res, ui[1]);
      }
      if (pathname === '/api/generate-unit' || pathname === '/api/tutor') {
        if (req.method !== 'POST') return send(res, 405, { message: N('Méthode non autorisée.') });
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

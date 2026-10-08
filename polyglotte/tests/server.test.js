import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let server;
let base;
let cacheDir;

before(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  cacheDir = await mkdtemp(path.join(tmpdir(), 'polyglotte-'));
  process.env.POLYGLOTTE_CACHE_DIR = cacheDir;
  const { createServer } = await import('../server/index.mjs');
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await rm(cacheDir, { recursive: true, force: true });
});

const post = (url, body) => fetch(base + url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('sert l’application mais pas les fichiers internes', async () => {
  assert.equal((await fetch(`${base}/`)).status, 200);
  assert.equal((await fetch(`${base}/src/main.js`)).headers.get('content-type'), 'text/javascript; charset=utf-8');
  for (const p of ['/package.json', '/server/index.mjs', '/.cache/x', '/src/../package.json', '/%2e%2e/etc/passwd']) {
    assert.equal((await fetch(base + p)).status, 404, p);
  }
});

test('sans clé d’API : les routes d’IA répondent « non configuré »', async () => {
  const r1 = await post('/api/generate-unit', { language: { id: 'ja', name: 'Japonais' }, unitId: 'a1-1' });
  assert.equal(r1.status, 503);
  assert.equal((await r1.json()).error, 'not-configured');
  const r2 = await post('/api/tutor', { language: { id: 'es', name: 'Espagnol' }, levelId: 'a1', history: [] });
  assert.equal(r2.status, 503);
});

test('entrées validées côté serveur', async () => {
  assert.equal((await post('/api/generate-unit', { language: { id: 'ja' }, unitId: 'z9-9' })).status, 400);
  assert.equal((await post('/api/generate-unit', { language: { id: 'x-evil', name: 'quechua' }, unitId: 'a1-1' })).status, 400);
  assert.equal((await post('/api/tutor', { language: { id: 'es' }, history: 'nope' })).status, 400);
  assert.equal((await post('/api/generate-unit', { language: { id: 'es' }, unitId: 'a1-m', sector: '../../etc' })).status, 400);
  assert.equal((await fetch(`${base}/api/tutor`)).status, 405);
  const big = await post('/api/tutor', { language: { id: 'es' }, history: [{ role: 'user', text: 'x'.repeat(40000) }] });
  assert.equal(big.status, 413);
});

test('une leçon déjà générée est servie depuis le cache, même sans clé', async () => {
  const unit = { id: 'a1-1', grammar: { title: 't', body: ['b'] }, items: [], dialogue: [], fact: null };
  await mkdir(path.join(cacheDir, 'units', 'x-quechua'), { recursive: true });
  await writeFile(path.join(cacheDir, 'units', 'x-quechua', 'a1-1.json'), JSON.stringify(unit));
  const r = await post('/api/generate-unit', { language: { id: 'x-quechua', name: 'Quechua' }, unitId: 'a1-1' });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).cached, true);
});

test('langue de base : validée, et rangée à part dans le cache', async () => {
  assert.equal((await post('/api/generate-unit', { language: { id: 'es' }, unitId: 'a1-1', base: 'klingon' })).status, 400);
  assert.equal((await post('/api/generate-unit', { language: { id: 'en' }, unitId: 'a1-1', base: 'en' })).status, 400);
  assert.equal((await post('/api/tutor', { language: { id: 'es' }, base: 'la', history: [] })).status, 400);
  const unit = { id: 'a1-1', grammar: { title: 'Greetings', body: ['b'] }, items: [], dialogue: [], fact: null };
  await mkdir(path.join(cacheDir, 'units', 'ja'), { recursive: true });
  await writeFile(path.join(cacheDir, 'units', 'ja', 'a1-1~en.json'), JSON.stringify(unit));
  const en = await post('/api/generate-unit', { language: { id: 'ja', name: 'Japonais' }, unitId: 'a1-1', base: 'en' });
  assert.equal((await en.json()).unit.grammar.title, 'Greetings');
  // Le cache anglais ne sert pas aux francophones.
  assert.equal((await post('/api/generate-unit', { language: { id: 'ja', name: 'Japonais' }, unitId: 'a1-1', base: 'fr' })).status, 503);
});

test('interface traduite : français, anglais et langues intégrées sans IA, autres langues depuis le cache', async () => {
  const { CATALOG, CATALOG_VERSION } = await import('../src/i18n.js');
  const en = await (await fetch(`${base}/api/ui/en`)).json();
  assert.equal(en.strings.Réglages, 'Settings');
  assert.equal(Object.keys(en.strings).length, CATALOG.length);
  const es = await (await fetch(`${base}/api/ui/es`)).json();
  assert.equal(es.strings.Réglages, 'Ajustes');
  assert.equal(Object.keys(es.strings).length, CATALOG.length);
  assert.equal((await fetch(`${base}/api/ui/ja`)).status, 503);
  assert.equal((await fetch(`${base}/api/ui/la`)).status, 400);
  assert.equal((await fetch(`${base}/api/ui/..%2f..%2fetc`)).status, 404);
  await mkdir(path.join(cacheDir, 'ui'), { recursive: true });
  await writeFile(path.join(cacheDir, 'ui', `ja-${CATALOG_VERSION}.json`), JSON.stringify({ Réglages: '設定' }));
  assert.equal((await (await fetch(`${base}/api/ui/ja`)).json()).strings.Réglages, '設定');
});

test('pays de connexion lu dans les en-têtes de l’hébergeur', async () => {
  assert.deepEqual(await (await fetch(`${base}/api/geo`)).json(), { country: null });
  assert.deepEqual(await (await fetch(`${base}/api/geo`, { headers: { 'cf-ipcountry': 'ci' } })).json(), { country: 'CI' });
  assert.deepEqual(await (await fetch(`${base}/api/geo`, { headers: { 'cf-ipcountry': 'XX' } })).json(), { country: null });
});

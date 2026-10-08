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

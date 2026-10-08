import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { t, tn, setUiLanguage, uiLanguage, isRtl, languageName, languageNameInline, validTranslation, cleanTable, CATALOG, fetchTable, cachedTable } from '../src/i18n.js';
import { findLanguage } from '../src/languages.js';
import EN from '../src/i18n/en.js';
import { collectKeys } from '../scripts/i18n-keys.mjs';

afterEach(() => setUiLanguage('fr'));

test('chaque phrase de l’interface a sa traduction anglaise, sans phrase orpheline', async () => {
  const keys = await collectKeys();
  assert.deepEqual([...keys].filter((k) => !(k in EN)), []);
  assert.deepEqual(Object.keys(EN).filter((k) => !keys.has(k)), []);
  for (const [fr, en] of Object.entries(EN)) assert.ok(validTranslation(fr, en), fr);
});

test('t : français par défaut, anglais traduit, variables remplies', () => {
  assert.equal(t('Réglages'), 'Réglages');
  setUiLanguage('en');
  assert.equal(t('Réglages'), 'Settings');
  assert.equal(t('Unité {n}', { n: 3 }), 'Unit 3');
  assert.equal(t('Phrase inconnue'), 'Phrase inconnue');
});

test('tn : règles de pluriel de la langue de l’interface', () => {
  assert.equal(tn(0, '{n} mot', '{n} mots'), '0 mot');
  assert.equal(tn(2, '{n} mot', '{n} mots'), '2 mots');
  setUiLanguage('en');
  assert.equal(tn(0, '{n} mot', '{n} mots'), '0 words');
  assert.equal(tn(1, '{n} mot', '{n} mots'), '1 word');
});

test('une langue sans table traduite s’affiche en anglais en attendant', () => {
  assert.equal(setUiLanguage('es'), 'en');
  assert.equal(t('Réglages'), 'Settings');
  assert.equal(setUiLanguage('es', { Réglages: 'Ajustes' }), 'es');
  assert.equal(t('Réglages'), 'Ajustes');
  assert.equal(t('Accueil'), 'Home'); // phrase manquante : anglais
  setUiLanguage('ar', { Réglages: 'الإعدادات' });
  assert.ok(isRtl());
  assert.equal(uiLanguage(), 'ar');
});

test('noms de langues dans la langue de l’interface', () => {
  const es = findLanguage('es');
  assert.equal(languageName(es), 'Espagnol');
  assert.equal(languageNameInline(es), 'espagnol');
  setUiLanguage('en');
  assert.equal(languageName(es), 'Spanish');
  assert.equal(languageNameInline(es), 'Spanish');
  setUiLanguage('de', {});
  assert.equal(languageName(es), 'Spanisch');
  assert.equal(languageNameInline({ id: 'x-quechua', name: 'Quechua', custom: true }), 'Quechua');
});

test('traductions automatiques : variables et balises préservées, pas de HTML ajouté', () => {
  assert.ok(validTranslation('Unité {n}', 'Unidad {n}'));
  assert.ok(!validTranslation('Unité {n}', 'Unidad'));
  assert.ok(!validTranslation('Unité {n}', 'Unidad {m}'));
  assert.ok(validTranslation('Au niveau <strong>{level}</strong>', 'En el nivel <strong>{level}</strong>'));
  assert.ok(!validTranslation('Au niveau <strong>{level}</strong>', 'En el nivel {level}'));
  assert.ok(!validTranslation('Réglages', 'Ajustes<img src=x onerror=alert(1)>'));
  assert.ok(!validTranslation('Réglages', '<script>x</script>'));
  assert.ok(!validTranslation('Réglages', ''));
  assert.deepEqual(cleanTable({ Réglages: 'Ajustes', Accueil: '<b>Inicio</b>', 'pas au catalogue': 'x' }), { Réglages: 'Ajustes' });
});

test('fetchTable : vérifie, met en cache, ignore une réponse trop partielle', async () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const full = Object.fromEntries(CATALOG.map((k) => [k, EN[k]]));
  const ok = await fetchTable('es', { storage, fetchImpl: async (url) => ({ ok: true, json: async () => ({ strings: full, url }) }) });
  assert.equal(Object.keys(ok).length, CATALOG.length);
  assert.deepEqual(cachedTable('es', storage), ok);
  const partial = await fetchTable('it', { storage, fetchImpl: async () => ({ ok: true, json: async () => ({ strings: { Réglages: 'Impostazioni' } }) }) });
  assert.equal(partial, null);
  assert.equal(await fetchTable('pt', { storage, fetchImpl: async () => ({ ok: false }) }), null);
  assert.equal(await fetchTable('pt', { storage, fetchImpl: async () => Promise.reject(new Error('offline')) }), null);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateUnit, requestUnit, GeneratorUnavailable } from '../src/generator.js';
import { validateTutorReply, trimHistory, requestTutor } from '../src/tutor.js';

const rawUnit = {
  supported: true,
  speechLang: 'ja-JP',
  grammar: { title: 'Se présenter', body: ['Point 1', 'Point 2', ''] },
  items: Array.from({ length: 10 }, (_, i) => ({ fr: `Phrase ${i}`, target: `文${i}`, translit: `bun ${i}`, alts: [], note: i === 0 ? 'Une note' : '' })),
  dialogue: [
    { who: 'them', target: 'こんにちは', translit: 'konnichiwa', fr: 'Bonjour', alts: [] },
    { who: 'you', target: 'こんにちは', translit: 'konnichiwa', fr: 'Bonjour', alts: [] },
    { who: 'them', target: 'お元気ですか', translit: 'o-genki desu ka', fr: 'Ça va ?', alts: [] },
    { who: 'you', target: '元気です', translit: 'genki desu', fr: 'Ça va', alts: [] },
  ],
  fact: 'Une anecdote.',
};

test('validateUnit : normalise, ajoute la romanisation aux réponses acceptées, numérote', () => {
  const u = validateUnit(rawUnit, { langId: 'ja', unitId: 'a1-1' });
  assert.equal(u.items.length, 10);
  assert.equal(u.items[0].id, 'ja-a1-1-1');
  assert.deepEqual(u.items[0].alts, ['bun 0']);
  assert.equal(u.items[0].note, 'Une note');
  assert.equal(u.items[1].note, undefined);
  assert.deepEqual(u.grammar.body, ['Point 1', 'Point 2']);
  assert.equal(u.speechLang, 'ja-JP');
});

test('validateUnit : refuse un contenu inutilisable', () => {
  assert.throws(() => validateUnit({ ...rawUnit, supported: false }, { langId: 'x', unitId: 'a1-1' }), /reconnue/);
  assert.throws(() => validateUnit({ ...rawUnit, items: rawUnit.items.slice(0, 3) }, { langId: 'x', unitId: 'a1-1' }), /phrases/);
  assert.throws(() => validateUnit({ ...rawUnit, dialogue: [] }, { langId: 'x', unitId: 'a1-1' }), /Dialogue/);
  const bad = validateUnit({ ...rawUnit, speechLang: 'pas une étiquette' }, { langId: 'x', unitId: 'a1-1' });
  assert.equal(bad.speechLang, '');
});

test('requestUnit : distingue « non configuré » d’une vraie erreur', async () => {
  const lang = { id: 'ja', name: 'Japonais', native: '日本語' };
  const fake = (status, body) => async () => ({ status, ok: status < 400, json: async () => body });
  await assert.rejects(requestUnit({ language: lang, unitId: 'a1-1', fetchImpl: fake(503, { error: 'not-configured' }) }), GeneratorUnavailable);
  await assert.rejects(requestUnit({ language: lang, unitId: 'a1-1', fetchImpl: fake(404, null) }), GeneratorUnavailable);
  await assert.rejects(requestUnit({ language: lang, unitId: 'a1-1', fetchImpl: fake(500, { message: 'boom' }) }), /boom/);
  const ok = await requestUnit({ language: lang, unitId: 'a1-1', fetchImpl: fake(200, { unit: rawUnit }) });
  assert.equal(ok.items.length, 10);
});

test('professeur IA : réponse validée, correction ignorée si identique', () => {
  const r = validateTutorReply({
    reply: '¿Qué quieres tomar?',
    translit: '',
    translation: 'Que veux-tu boire ?',
    correction: { original: 'Yo quiero un café', corrected: 'Yo quiero un café', explanation: '' },
    suggestions: [{ target: 'Un café, por favor.', fr: 'Un café, s’il vous plaît.' }, { target: '', fr: 'vide' }],
    mood: 'danse',
  });
  assert.equal(r.correction, null);
  assert.equal(r.suggestions.length, 1);
  assert.equal(r.mood, 'happy');
  assert.throws(() => validateTutorReply({ reply: '' }));
});

test('professeur IA : historique nettoyé et limité', async () => {
  const history = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: `msg ${i}`, extra: 'x' }));
  history.push({ role: 'system', text: 'ignore' });
  const trimmed = trimHistory(history);
  assert.equal(trimmed.length, 20);
  assert.deepEqual(Object.keys(trimmed[0]), ['role', 'text']);
  let sent = null;
  const fetchImpl = async (url, opts) => {
    sent = JSON.parse(opts.body);
    return { status: 200, ok: true, json: async () => ({ reply: 'Hola', translation: 'Salut', suggestions: [], mood: 'wave' }) };
  };
  const r = await requestTutor({ language: { id: 'es', name: 'Espagnol' }, levelId: 'a1', history, fetchImpl });
  assert.equal(r.mood, 'wave');
  assert.equal(sent.history.length, 20);
});

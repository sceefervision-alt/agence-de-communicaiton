import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankVoices, sentences, chunks, isLikelyFemale } from '../src/speech.js';

const v = (name, lang, extra = {}) => ({ name, lang, voiceURI: name, localService: true, ...extra });
const best = (voices, lang) => rankVoices(voices, lang)[0]?.name;

test('voix : la plus naturelle et féminine passe devant', () => {
  const fr = [v('Microsoft Paul - French (France)', 'fr-FR', { default: true }), v('Thomas', 'fr-FR'), v('Google français', 'fr-FR'), v('Microsoft Denise Online (Natural) - French (France)', 'fr-FR', { localService: false })];
  assert.equal(best(fr, 'fr-FR'), 'Microsoft Denise Online (Natural) - French (France)');
  const en = [v('Microsoft David - English (United States)', 'en-US'), v('Google UK English Male', 'en-GB'), v('Samantha', 'en-US'), v('Fred', 'en-US')];
  assert.equal(best(en, 'en-US'), 'Samantha');
  assert.equal(best([v('Maged', 'ar-SA'), v('Laila', 'ar-SA')], 'ar-SA'), 'Laila');
  assert.equal(best([v('Monica', 'es-ES'), v('Paulina', 'es_MX')], 'es-MX'), 'Paulina');
});

test('voix : les voix robotiques passent après, une voix masculine reste possible faute de mieux', () => {
  assert.equal(best([v('Grandma (English (US))', 'en-US'), v('Google US English', 'en-US')], 'en-US'), 'Google US English');
  assert.equal(best([v('eSpeak Italian female', 'it-IT'), v('Alice', 'it-IT')], 'it-IT'), 'Alice');
  assert.equal(best([v('Luca', 'it-IT')], 'it-IT'), 'Luca');
  assert.deepEqual(rankVoices([v('Alice', 'it-IT')], 'ja-JP'), []);
  assert.equal(isLikelyFemale(v('Google UK English Male', 'en-GB')), false);
  assert.equal(isLikelyFemale(v('Microsoft Aria Online (Natural)', 'en-US')), true);
});

test('lecture phrase par phrase', () => {
  assert.deepEqual(sentences('Hola. ¿Qué tal? Muy bien, gracias…'), ['Hola.', '¿Qué tal?', 'Muy bien, gracias…']);
  assert.deepEqual(sentences('こんにちは。元気ですか？'), ['こんにちは。', '元気ですか？']);
  assert.deepEqual(sentences('Sans point final'), ['Sans point final']);
  assert.deepEqual(chunks('Hi! I’m Emma. What’s your name?'), ['Hi! I’m Emma. What’s your name?']);
  const long = Array.from({ length: 12 }, (_, i) => `This is sentence number ${i + 1}.`).join(' ');
  const parts = chunks(long);
  assert.ok(parts.length > 1 && parts.every((p) => p.length < 160));
  assert.equal(parts.join(' '), long);
});

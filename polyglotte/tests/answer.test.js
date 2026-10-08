import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, normalize, wordDiff } from '../src/answer.js';

const es = { lang: 'es' };
const en = { lang: 'en' };

test('ignore la casse, la ponctuation et ¿ ¡', () => {
  assert.equal(checkAnswer('como te llamas', ['¿Cómo te llamas?'], es).status, 'almost');
  assert.equal(checkAnswer('¿cómo te llamas', ['¿Cómo te llamas?'], es).status, 'correct');
  assert.equal(checkAnswer('  HOLA  ', ['¡Hola!'], es).status, 'correct');
});

test('accent manquant : accepté mais signalé, refusé en mode strict', () => {
  const r = checkAnswer('Soy frances', ['Soy francés.'], es);
  assert.equal(r.status, 'almost');
  assert.equal(r.issues[0].type, 'accent');
  assert.equal(r.issues[0].expected, 'francés');
  assert.match(r.message, /accent/);
  assert.equal(checkAnswer('Soy frances', ['Soy francés.'], { ...es, strictAccents: true }).status, 'wrong');
});

test('faute de frappe tolérée sur les mots longs, pas sur les mots courts', () => {
  const r = checkAnswer('Trabajo en una ofisina', ['Trabajo en una oficina.'], es);
  assert.equal(r.status, 'almost');
  assert.equal(r.issues[0].type, 'typo');
  // « sol » vs « sal » : mot court, ce n'est pas une faute de frappe
  assert.equal(checkAnswer('sol', ['sal'], es).status, 'wrong');
});

test("erreur d'article expliquée", () => {
  const r = checkAnswer('Quisiera un cerveza', ['Quisiera una cerveza.'], es);
  assert.equal(r.status, 'wrong');
  assert.equal(r.issues[0].type, 'article');
  assert.match(r.message, /article/);
});

test('ordre des mots détecté', () => {
  const r = checkAnswer('cuenta la por favor', ['La cuenta, por favor.'], es);
  assert.equal(r.issues[0].type, 'order');
});

test('mot manquant ou en trop identifié', () => {
  const missing = checkAnswer('Me levanto a siete', ['Me levanto a las siete.'], es);
  assert.equal(missing.issues[0].type, 'missing');
  assert.equal(missing.issues[0].expected, 'las');
  const extra = checkAnswer('I work in an the office', ['I work in an office.'], en);
  assert.equal(extra.issues[0].type, 'extra');
  assert.equal(extra.issues[0].got, 'the');
});

test('contractions anglaises équivalentes', () => {
  assert.equal(checkAnswer('I am French', ["I'm French."], en).status, 'correct');
  assert.equal(checkAnswer("I'm looking for the museum", ['I am looking for the museum'], en).status, 'correct');
  assert.equal(checkAnswer('I do not work on Sundays', ["I don't work on Sundays."], en).status, 'correct');
  assert.equal(checkAnswer('I’m French', ["I'm French."], en).status, 'correct'); // apostrophe typographique
});

test('les réponses alternatives sont acceptées et la meilleure est retenue', () => {
  const r = checkAnswer('Soy Ana', ['Me llamo Ana.', 'Soy Ana.'], es);
  assert.equal(r.status, 'correct');
  assert.equal(r.expected, 'Soy Ana.');
  assert.equal(r.canonical, 'Me llamo Ana.');
});

test('réponse vide', () => {
  assert.equal(checkAnswer('', ['Hola'], es).issues[0].type, 'empty');
});

test('wordDiff marque les mots manquants et en trop', () => {
  const ops = wordDiff(['la', 'cuenta', 'por', 'favor'], ['la', 'cuenta', 'favor', 'gracias']);
  assert.deepEqual(
    ops.map((o) => o.type),
    ['same', 'same', 'missing', 'same', 'extra'],
  );
});

test('normalize', () => {
  assert.equal(normalize('¿Dónde está la estación?', 'es'), 'dónde está la estación');
  assert.equal(normalize("What's your name?", 'en'), 'what is your name');
});

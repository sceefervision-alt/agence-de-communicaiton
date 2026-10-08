import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCard, review, isDue, isMastered, markKnown, forecast, DAY } from '../src/srs.js';

const NOW = new Date('2026-10-08T10:00:00').getTime();

test('les bonnes réponses espacent les révisions de plus en plus', () => {
  let c = newCard();
  c = { ...c, stage: 1 };
  const intervals = [];
  let t = NOW;
  for (let i = 0; i < 5; i++) {
    c = review(c, 'good', t);
    intervals.push(c.interval);
    t = c.due;
  }
  assert.deepEqual(intervals.slice(0, 2), [1, 3]);
  for (let i = 1; i < intervals.length; i++) assert.ok(intervals[i] > intervals[i - 1]);
  assert.ok(isMastered(c));
});

test('une erreur rapproche la révision sans rien "coûter"', () => {
  let c = review({ ...newCard(), stage: 3, reps: 3, interval: 10, ease: 2.5 }, 'again', NOW);
  assert.equal(c.interval, 0);
  assert.equal(c.lapses, 1);
  assert.equal(c.stage, 2); // redescend d'un niveau d'exercice
  assert.ok(c.ease < 2.5 && c.ease >= 1.3);
  assert.ok(isDue(c, NOW + 11 * 60 * 1000));
});

test('le niveau monte avec les bonnes réponses et plafonne', () => {
  let c = { ...newCard(), stage: 1 };
  for (let i = 0; i < 10; i++) c = review(c, 'easy', NOW);
  assert.equal(c.stage, 5);
});

test('une carte jamais vue n\'est jamais "due"', () => {
  assert.equal(isDue(newCard(), NOW), false);
});

test('markKnown place la carte au rappel actif avec vérification sous 3 jours', () => {
  const c = markKnown(newCard(), NOW);
  assert.equal(c.stage, 3);
  assert.equal(c.due, NOW + 3 * DAY);
  const strong = { ...newCard(), stage: 5, interval: 30 };
  assert.equal(markKnown(strong, NOW), strong);
});

test('forecast compte les révisions en retard aujourd\'hui', () => {
  const cards = [
    { ...newCard(), stage: 2, due: NOW - 5 * DAY },
    { ...newCard(), stage: 2, due: NOW + DAY },
    { ...newCard(), stage: 0, due: 0 },
  ];
  const f = forecast(cards, NOW, 7);
  assert.equal(f[0], 1);
  assert.equal(f[1], 1);
  assert.equal(f.reduce((a, b) => a + b, 0), 2);
});

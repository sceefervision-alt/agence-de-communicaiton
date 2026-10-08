import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weeklyStatus, logActivity, unitProgress, dateKey } from '../src/progress.js';
import { load, save, importJSON, exportJSON, defaultState } from '../src/storage.js';
import { COURSES } from '../src/data/index.js';

// Jeudi 8 octobre 2026
const THU = new Date('2026-10-08T10:00:00').getTime();

test("objectif hebdomadaire : les jours de repos ne cassent rien", () => {
  let log = { days: {} };
  log = logActivity(log, { answers: 10, correct: 8 }, new Date('2026-10-05T09:00:00').getTime()); // lundi
  log = logActivity(log, { answers: 5, correct: 5 }, THU);
  const w = weeklyStatus(log, 4, THU);
  assert.equal(w.active, 2);
  assert.equal(w.reached, false);
  assert.equal(w.days[0].active, true);
  assert.equal(w.days[1].active, false); // mardi de repos : aucune pénalité
  assert.equal(w.days[3].today, true);
  assert.equal(w.days[4].future, true);
});

test('logActivity cumule les réponses du jour', () => {
  let log = { days: {} };
  log = logActivity(log, { answers: 3, correct: 2 }, THU);
  log = logActivity(log, { answers: 4, correct: 4 }, THU);
  assert.deepEqual(log.days[dateKey(THU)], { answers: 7, correct: 6, sessions: 2 });
});

test('compétence « Je peux… » validée à 80 %', () => {
  const unit = COURSES.es.units[0];
  const cards = {};
  unit.items.slice(0, 8).forEach((it) => (cards[it.id] = { stage: 3 }));
  assert.equal(unitProgress(unit, cards).canDo, true);
  delete cards[unit.items[0].id];
  assert.equal(unitProgress(unit, cards).canDo, false);
});

test('stockage : sauvegarde, rechargement, export / import', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const state = defaultState();
  state.settings.course = 'en';
  state.cards.en = { 'en-1-1': { stage: 2 } };
  save(state, storage);
  assert.equal(load(storage).settings.course, 'en');
  const back = importJSON(exportJSON(state));
  assert.deepEqual(back.cards, state.cards);
  assert.throws(() => importJSON('{"foo":1}'));
});

test('stockage corrompu : on repart proprement', () => {
  const storage = { getItem: () => '{pas du json', setItem: () => {} };
  assert.deepEqual(load(storage), defaultState());
});

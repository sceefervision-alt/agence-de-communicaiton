import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse } from '../src/course.js';
import { CURATED } from '../src/data/index.js';
import { buildSession, buildTestOut, buildRoleplay, requeue, exerciseTypeFor, mulberry32, allItems, acceptedAnswers } from '../src/session.js';
import { newCard, DAY } from '../src/srs.js';
import { checkAnswer } from '../src/answer.js';

const NOW = new Date('2026-10-08T10:00:00').getTime();
const es = buildCourse('es');

test('une première session présente les nouveaux éléments puis les vérifie', () => {
  const q = buildSession({ course: es, cards: {}, unitId: 'a1-1', settings: { newPerSession: 5 }, now: NOW, rng: mulberry32(1) });
  const intros = q.filter((e) => e.kind === 'intro');
  const checks = q.filter((e) => e.kind === 'choice-target');
  assert.equal(intros.length, 5);
  assert.equal(checks.length, 5);
  // chaque élément est découvert avant d'être vérifié
  for (const c of checks) {
    const introIdx = q.findIndex((e) => e.kind === 'intro' && e.itemId === c.itemId);
    assert.ok(introIdx < q.indexOf(c));
  }
});

test('les QCM contiennent la bonne réponse et des distracteurs distincts', () => {
  const q = buildSession({ course: es, cards: {}, unitId: 'a1-2', now: NOW, rng: mulberry32(2) });
  for (const ex of q.filter((e) => e.options)) {
    assert.equal(ex.options.length, 4);
    assert.ok(ex.options.includes(ex.answer));
    assert.equal(new Set(ex.options.map((o) => o.toLowerCase())).size, 4);
  }
});

test('les révisions dues passent en priorité dans le mode Réviser', () => {
  const cards = {
    'es-1-1': { ...newCard(), stage: 3, due: NOW - DAY },
    'es-1-2': { ...newCard(), stage: 2, due: NOW + 5 * DAY },
  };
  const q = buildSession({ course: es, cards, now: NOW, rng: mulberry32(3) });
  assert.deepEqual(q.map((e) => e.itemId), ['es-1-1']);
  assert.equal(q[0].kind, 'write');
});

test("le type d'exercice suit le niveau : reconnaissance puis production", () => {
  assert.equal(exerciseTypeFor(0), 'intro');
  assert.equal(exerciseTypeFor(1), 'choice-target');
  assert.equal(exerciseTypeFor(2, { audio: true }), 'listen-choice');
  assert.equal(exerciseTypeFor(2, { audio: false }), 'choice-native');
  assert.equal(exerciseTypeFor(3), 'write');
  assert.ok(['write', 'dictation', 'speak'].includes(exerciseTypeFor(4, { audio: true, speech: true })));
});

test('requeue : un élément raté revient plus loin, sans pénalité', () => {
  const q = [{ kind: 'write', itemId: 'a' }, { kind: 'write', itemId: 'b' }, { kind: 'write', itemId: 'c' }];
  const out = requeue(q, 0, q[0], 3);
  assert.equal(out.length, 4);
  assert.equal(out[3].itemId, 'a');
  assert.equal(out[3].retry, true);
  assert.equal(requeue(q, 0, { kind: 'intro', itemId: 'x' }).length, 3);
  // pas de boucle infinie : au bout de 2 reprises, on laisse la répétition espacée prendre le relais
  const twice = requeue(out, 3, out[3]);
  assert.equal(twice.length, 5);
  assert.equal(twice[4].retries, 2);
  assert.equal(requeue(twice, 4, twice[4]).length, 5);
});

test('test « Je connais déjà » et jeu de rôle', () => {
  const t = buildTestOut(es, 'a1-3', mulberry32(4));
  assert.equal(t.length, 6);
  assert.ok(t.every((e) => e.kind === 'write' && e.testOut));
  const r = buildRoleplay(es, 'a1-2');
  assert.equal(r.length, 3);
  assert.ok(r.every((e) => e.context.length === e.lineIndex));
});

test('vocabulaire personnel intégré au cours', () => {
  const items = allItems(es, [{ id: 'perso-1', fr: 'chat', target: 'gato' }], { 'es-1-1': ['¡Buenas!'] });
  assert.ok(items.find((i) => i.id === 'perso-1' && i.unitId === 'perso'));
  assert.ok(items.find((i) => i.id === 'es-1-1').alts.includes('¡Buenas!'));
});

test('contenu écrit à la main : ids uniques et chaque réponse attendue se valide elle-même', () => {
  const ids = new Set();
  for (const langId of Object.keys(CURATED)) {
    const course = buildCourse(langId);
    const ready = course.units.filter((u) => u.ready);
    const a1 = ready.filter((u) => u.levelId === 'a1');
    assert.equal(a1.length, 8, `${langId} : niveau A1 (quotidien + pro) complet`);
    assert.equal(a1.filter((u) => u.track === 'pro').length, 3);
    // Un niveau commencé à la main l'est entièrement (hors « Mon métier »).
    for (const lvl of new Set(ready.map((u) => u.levelId))) {
      assert.equal(ready.filter((u) => u.levelId === lvl).length, 8, `${langId} ${lvl} complet`);
    }
    for (const unit of ready) {
      assert.ok(unit.canDo && unit.grammar?.body?.length && unit.dialogue?.length && unit.fact, `${langId} ${unit.id}`);
      assert.ok(unit.dialogue.filter((l) => l.who === 'you').length >= 2);
      for (const item of unit.items) {
        assert.ok(!ids.has(item.id), `id dupliqué ${item.id}`);
        ids.add(item.id);
        for (const ans of acceptedAnswers(item)) {
          assert.equal(checkAnswer(ans, acceptedAnswers(item), { lang: langId }).status, 'correct', ans);
        }
      }
    }
  }
});

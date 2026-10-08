import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScriptedTutor, canConverse, overlap } from '../src/scripted-tutor.js';
import { buildCourse } from '../src/course.js';

const unit = buildCourse('es').units.find((u) => u.id === 'a1-1');

test('conversation guidée : Bao ouvre, l’apprenant répond, Bao enchaîne', () => {
  assert.ok(canConverse(unit));
  const bao = createScriptedTutor({ unit, lang: 'es' });
  const first = bao.start();
  assert.match(first.reply, /Lucía/);
  assert.ok(first.translation && first.suggestions.length >= 1);
  assert.equal(first.done, false);

  const ok = bao.respond('Me llamo Ana');
  assert.equal(ok.accepted, true);
  assert.equal(ok.correction, null);
  assert.equal(ok.mood, 'cheer');
  assert.match(ok.reply, /Encantada/);
});

test('une réponse proche est comprise, avec la tournure naturelle en correction', () => {
  const bao = createScriptedTutor({ unit, lang: 'es' });
  bao.start();
  const close = bao.respond('hola yo llamo Ana');
  assert.equal(close.accepted, true);
  assert.ok(close.correction?.corrected);
  assert.ok(overlap('hola yo llamo Ana', 'Hola, me llamo Ana.', 'es') >= 0.6);
});

test('une réponse hors sujet : Bao souffle des idées, puis donne la réplique', () => {
  const bao = createScriptedTutor({ unit, lang: 'es' });
  bao.start();
  const retry = bao.respond('pizza');
  assert.equal(retry.accepted, false);
  assert.equal(retry.reply, '');
  assert.ok(retry.note && retry.suggestions.length);
  const shown = bao.respond('pizza');
  assert.equal(shown.correction.corrected, 'Me llamo Ana.');
  assert.match(shown.reply, /Encantada/);
});

test('le dialogue va jusqu’au bout', () => {
  const bao = createScriptedTutor({ unit, lang: 'es' });
  let reply = bao.start();
  let turns = 0;
  while (!reply.done && turns++ < 10) reply = bao.respond(reply.suggestions[0].target);
  assert.equal(reply.done, true);
  assert.ok(reply.note);
});

test('pas de conversation guidée sans dialogue prêt', () => {
  assert.equal(canConverse(buildCourse('ja').units[0]), false);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultRewards, sessionEarnings, applyEarnings, newTrophies, buy, toggleEquip, dailyChallenge, REWARD, CHALLENGES } from '../src/rewards.js';
import { outfitFor, panda, garden, MOODS } from '../src/panda.js';

const NOW = new Date('2026-10-08T10:00:00').getTime();
const snap = (recalled, units, levelsDone) => ({ recalled, units, levelsDone });

test('les bambous récompensent l’apprentissage réel, pas les clics', () => {
  const rewards = defaultRewards();
  const summary = { mode: 'apprendre', answers: 10, correct: 5, wrong: 5, learned: 0, written: 0 };
  // session sans progrès réel : aucun bambou (hors défi éventuel)
  const none = sessionEarnings({ before: snap(3, 0, 0), after: snap(3, 0, 0), summary: { ...summary, answers: 1 }, weeklyReached: false, rewards, langId: 'es', now: NOW });
  assert.equal(none.filter((g) => !g.challenge).length, 0);
  const gains = sessionEarnings({ before: snap(3, 0, 0), after: snap(7, 1, 0), summary, weeklyReached: false, rewards, langId: 'es', now: NOW });
  const total = gains.filter((g) => !g.challenge).reduce((a, g) => a + g.amount, 0);
  assert.equal(total, 4 * REWARD.recalled + REWARD.unit);
});

test('objectif hebdomadaire et coffre : une seule fois par semaine', () => {
  let rewards = defaultRewards();
  const args = { before: snap(0, 0, 0), after: snap(0, 0, 0), summary: { mode: 'x', answers: 1 }, weeklyReached: true, langId: 'es', now: NOW };
  const g1 = sessionEarnings({ ...args, rewards });
  assert.ok(g1.some((g) => g.weekly) && g1.some((g) => g.chest));
  rewards = applyEarnings(rewards, g1, { langId: 'es', levelsDone: 0, now: NOW });
  assert.equal(rewards.stats.weeks, 1);
  const g2 = sessionEarnings({ ...args, rewards });
  assert.ok(!g2.some((g) => g.weekly || g.chest));
});

test('niveau terminé récompensé une seule fois', () => {
  let rewards = defaultRewards();
  const args = { before: snap(0, 3, 0), after: snap(0, 4, 1), summary: { mode: 'x', answers: 1 }, weeklyReached: false, langId: 'es', now: NOW };
  const g = sessionEarnings({ ...args, rewards });
  assert.ok(g.some((x) => x.levelUp));
  rewards = applyEarnings(rewards, g, { langId: 'es', levelsDone: 1, now: NOW });
  assert.ok(!sessionEarnings({ ...args, rewards }).some((x) => x.levelUp));
});

test('défi du jour déterministe et testable', () => {
  assert.equal(dailyChallenge(NOW).id, dailyChallenge(NOW + 3600_000).id);
  const role = CHALLENGES.find((c) => c.id === 'role');
  assert.equal(role.test({ mode: 'role', answers: 2 }), true);
});

test('boutique : achat, équipement, solde insuffisant', () => {
  let r = { ...defaultRewards(), bamboo: 30 };
  assert.throws(() => buy(r, 'crown'), /bambous/);
  r = buy(r, 'flowers');
  assert.equal(r.bamboo, 15);
  assert.equal(r.equipped.head, 'flowers');
  assert.throws(() => buy(r, 'flowers'), /déjà/);
  r = toggleEquip(r, 'flowers');
  assert.equal(r.equipped.head, undefined);
  r = buy({ ...r, bamboo: 10 }, 'lantern');
  assert.deepEqual(r.garden, ['lantern']);
});

test('trophées débloqués selon le contexte', () => {
  const t = newTrophies(defaultRewards(), { sessions: 1, recalled: 12, units: 1, levelsDone: 0, weeks: 0, perfect: 0, roleplays: 0, chats: 1, languages: 1, owned: 0 }, NOW);
  assert.deepEqual(t.map((x) => x.id).sort(), ['chat', 'first', 'r10', 'unit']);
});

test('Bao : tenue selon le niveau, personnalisable, toutes les humeurs dessinables', () => {
  assert.deepEqual(outfitFor(0), { head: 'sprout' });
  assert.equal(outfitFor(5).head, 'gradcap');
  assert.equal(outfitFor(5, { head: 'crown' }).head, 'crown');
  assert.equal(outfitFor(1, { neck: 'none' }).neck, undefined);
  for (const mood of MOODS) assert.match(panda({ mood }), /^<svg class="panda mood-/);
  assert.match(panda({ label: 'Bao "content"' }), /aria-label="Bao &quot;content&quot;"/);
  assert.match(garden({ stalks: 10, level: 5, decor: ['pond'] }), /<svg class="garden"/);
});

// Construction des sessions d'exercices.
// Pas de vies : une erreur remet l'élément plus loin dans la file pour le
// retravailler. Le type d'exercice dépend du niveau atteint sur chaque
// élément (reconnaissance → rappel actif → production).

import { isDue, weakness, newCard } from './srs.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Tous les éléments d'un cours, y compris le vocabulaire personnel.
export function allItems(course, custom = [], extraAlts = {}) {
  const items = [];
  for (const unit of course.units) {
    for (const item of unit.items) items.push({ ...item, unitId: unit.id });
  }
  for (const item of custom) items.push({ ...item, unitId: 'perso', custom: true });
  return items.map((item) => ({ ...item, alts: [...(item.alts ?? []), ...(extraAlts[item.id] ?? [])] }));
}

export function acceptedAnswers(item) {
  return [item.target, ...(item.alts ?? [])];
}

export function exerciseTypeFor(stage, caps = {}) {
  if (stage <= 0) return 'intro';
  if (stage === 1) return 'choice-target';
  if (stage === 2) return caps.audio ? 'listen-choice' : 'choice-native';
  if (stage === 3) return 'write';
  // Niveau production : on alterne écrit, dictée et oral.
  const pool = ['write'];
  if (caps.audio) pool.push('dictation');
  if (caps.speech) pool.push('speak');
  return pool[(stage + (caps.salt ?? 0)) % pool.length];
}

function distractors(item, items, field, count, rng) {
  const seen = new Set([item[field].toLowerCase()]);
  const sameUnit = shuffle(items.filter((o) => o.id !== item.id && o.unitId === item.unitId), rng);
  const others = shuffle(items.filter((o) => o.id !== item.id && o.unitId !== item.unitId), rng);
  const out = [];
  for (const o of [...sameUnit, ...others]) {
    const key = o[field].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o[field]);
    if (out.length === count) break;
  }
  return out;
}

export function makeExercise(kind, item, items, rng = Math.random) {
  const ex = { kind, itemId: item.id, item };
  if (kind === 'choice-target' || kind === 'listen-choice' || kind === 'choice-native') {
    // choice-target : on lit le français, on choisit la phrase en langue cible.
    // choice-native / listen-choice : on lit (ou entend) la langue cible, on choisit le sens.
    const field = kind === 'choice-target' ? 'target' : 'fr';
    const options = shuffle([item[field], ...distractors(item, items, field, 3, rng)], rng);
    ex.options = options;
    ex.answer = item[field];
  }
  return ex;
}

function interleave(a, b) {
  const out = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

// Session « Apprendre » (unitId donné) ou « Réviser » (unitId absent).
export function buildSession({ course, cards, custom = [], extraAlts = {}, unitId = null, settings = {}, caps = {}, now = Date.now(), rng = Math.random }) {
  const items = allItems(course, custom, extraAlts);
  const cardOf = (id) => cards[id] ?? newCard();
  const maxReviews = settings.maxReviews ?? 12;
  const newCount = settings.newPerSession ?? 5;

  const due = items
    .filter((it) => isDue(cards[it.id], now))
    .sort((x, y) => cardOf(x.id).due - cardOf(y.id).due || weakness(cardOf(y.id)) - weakness(cardOf(x.id)));

  let reviews = due.slice(0, unitId ? Math.min(maxReviews, 6) : maxReviews);
  let fresh = [];

  if (unitId) {
    fresh = items.filter((it) => it.unitId === unitId && cardOf(it.id).stage === 0).slice(0, newCount);
    if (fresh.length === 0 && reviews.length === 0) {
      // Unité déjà découverte et rien à réviser : on retravaille ses éléments les plus fragiles.
      reviews = items
        .filter((it) => it.unitId === unitId)
        .sort((x, y) => weakness(cardOf(y.id)) - weakness(cardOf(x.id)))
        .slice(0, 8);
    }
  } else if (reviews.length === 0) {
    // Rien d'urgent : entraînement libre sur les points faibles.
    reviews = items
      .filter((it) => cardOf(it.id).stage > 0)
      .sort((x, y) => weakness(cardOf(y.id)) - weakness(cardOf(x.id)))
      .slice(0, 8);
  }

  const reviewExercises = reviews.map((it, i) =>
    makeExercise(exerciseTypeFor(Math.max(1, cardOf(it.id).stage), { ...caps, salt: i }), it, items, rng),
  );

  // Chaque nouvel élément : découverte, puis reconnaissance quelques exercices
  // plus tard (un petit espacement aide déjà la mémorisation).
  const reviewsShuffled = shuffle(reviewExercises, rng);
  const freshIntro = fresh.map((it) => makeExercise('intro', it, items, rng));
  let queue = interleave(freshIntro, reviewsShuffled);
  for (const it of fresh) {
    const introIdx = queue.findIndex((e) => e.kind === 'intro' && e.itemId === it.id);
    const at = Math.min(queue.length, introIdx + 3);
    queue = [...queue.slice(0, at), makeExercise('choice-target', it, items, rng), ...queue.slice(at)];
  }
  return queue;
}

// Après une erreur : l'élément revient 3 exercices plus loin (sans pénalité).
// Au-delà de MAX_RETRIES, on n'insiste pas : la répétition espacée le
// reproposera très vite, sans transformer la session en boucle sans fin.
export const MAX_RETRIES = 2;

export function requeue(queue, index, exercise, gap = 3) {
  if (exercise.kind === 'intro') return queue; // la découverte n'est pas notée
  const retries = (exercise.retries ?? 0) + 1;
  if (retries > MAX_RETRIES) return queue;
  const at = Math.min(queue.length, index + 1 + gap);
  return [...queue.slice(0, at), { ...exercise, retry: true, retries }, ...queue.slice(at)];
}

// Test « Je connais déjà » : rappel actif écrit sur un échantillon de l'unité.
export function buildTestOut(course, unitId, rng = Math.random, size = 6) {
  const unit = course.units.find((u) => u.id === unitId);
  if (!unit) return [];
  const items = allItems(course);
  return shuffle(unit.items, rng)
    .slice(0, size)
    .map((it) => ({ ...makeExercise('write', { ...it, unitId }, items, rng), testOut: true }));
}

export const TEST_OUT_THRESHOLD = 0.8;

// Jeu de rôle : l'apprenant tape ses répliques du dialogue de l'unité.
export function buildRoleplay(course, unitId) {
  const unit = course.units.find((u) => u.id === unitId);
  if (!unit?.dialogue) return [];
  const out = [];
  unit.dialogue.forEach((line, idx) => {
    if (line.who !== 'you') return;
    out.push({
      kind: 'roleplay',
      itemId: `${unitId}-dlg-${idx}`,
      item: { id: `${unitId}-dlg-${idx}`, fr: line.fr, target: line.target, alts: line.alts ?? [], unitId },
      context: unit.dialogue.slice(0, idx),
      lineIndex: idx,
    });
  });
  return out;
}

// Répétition espacée (variante de SM-2).
// Chaque élément (mot ou phrase) possède une « carte » qui mémorise quand le
// revoir. Une erreur ne sanctionne pas : elle rapproche simplement la
// prochaine révision et fait redescendre l'élément d'un niveau d'exercice.

export const DAY = 24 * 60 * 60 * 1000;
export const MINUTE = 60 * 1000;

// Niveaux d'exercice : 0 = jamais vu, 1 = découvert, 2 = reconnu,
// 3 = rappel écrit, 4+ = production (dictée, oral).
export const MAX_STAGE = 5;
export const MASTERED_INTERVAL = 21; // jours

export const GRADES = ['again', 'hard', 'good', 'easy'];

export function newCard() {
  return {
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    stage: 0,
    due: 0,
    seen: 0,
    correct: 0,
    lastReview: 0,
  };
}

export function review(card, grade, now = Date.now()) {
  if (!GRADES.includes(grade)) throw new Error(`Note inconnue : ${grade}`);
  const c = { ...card, seen: card.seen + 1, lastReview: now };

  if (grade === 'again') {
    c.lapses += 1;
    c.reps = 0;
    c.interval = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.stage = Math.max(1, c.stage - 1);
    c.due = now + 10 * MINUTE;
    return c;
  }

  c.correct += 1;
  c.reps += 1;
  if (grade === 'hard') {
    c.ease = Math.max(1.3, c.ease - 0.15);
    c.interval = c.reps === 1 ? 1 : Math.max(c.interval + 1, Math.round(c.interval * 1.2));
  } else if (grade === 'good') {
    if (c.reps === 1) c.interval = 1;
    else if (c.reps === 2) c.interval = 3;
    else c.interval = Math.max(c.interval + 1, Math.round(c.interval * c.ease));
  } else {
    c.ease += 0.15;
    c.interval = c.reps === 1 ? 3 : Math.max(c.interval + 2, Math.round(c.interval * c.ease * 1.3));
  }
  c.stage = Math.min(MAX_STAGE, c.stage + (grade === 'easy' ? 2 : 1));
  c.due = now + c.interval * DAY;
  return c;
}

// Validation d'une unité via le test « Je connais déjà » : on considère les
// éléments comme connus, mais la répétition espacée les vérifiera bientôt.
export function markKnown(card, now = Date.now()) {
  if (card.stage >= 3) return card;
  return { ...card, stage: 3, reps: Math.max(card.reps, 2), interval: 3, due: now + 3 * DAY, lastReview: now };
}

export function isDue(card, now = Date.now()) {
  return !!card && card.stage > 0 && card.due <= now;
}

export function isMastered(card) {
  return !!card && card.interval >= MASTERED_INTERVAL;
}

export function isLearning(card) {
  return !!card && card.stage > 0 && !isMastered(card);
}

// Nombre de révisions à prévoir pour chacun des `days` prochains jours
// (index 0 = aujourd'hui, en incluant les révisions déjà en retard).
export function forecast(cards, now = Date.now(), days = 7) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const counts = new Array(days).fill(0);
  for (const card of cards) {
    if (!card || card.stage === 0) continue;
    const offset = Math.floor((card.due - startOfToday.getTime()) / DAY);
    const idx = Math.max(0, offset);
    if (idx < days) counts[idx] += 1;
  }
  return counts;
}

// Les éléments les plus fragiles d'abord : beaucoup d'oublis, facilité basse.
export function weakness(card) {
  if (!card || card.stage === 0) return -Infinity;
  return card.lapses * 2 + (2.5 - card.ease) * 4 - Math.min(card.interval, 30) / 10;
}

// Suivi de progression sans XP ni ligues : objectif hebdomadaire (les jours
// de repos ne font rien perdre), mots maîtrisés et objectifs « Je peux… ».

import { isDue, isLearning, isMastered, forecast } from './srs.js';
import { levelThreshold } from './curriculum.js';

export function dateKey(ts = Date.now()) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function startOfWeek(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function logActivity(log, { answers = 0, correct = 0 } = {}, now = Date.now()) {
  const key = dateKey(now);
  const day = log.days[key] ?? { answers: 0, correct: 0, sessions: 0 };
  return {
    ...log,
    days: {
      ...log.days,
      [key]: { answers: day.answers + answers, correct: day.correct + correct, sessions: day.sessions + 1 },
    },
  };
}

export const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function weeklyStatus(log, goalDays, now = Date.now()) {
  const start = startOfWeek(now);
  const today = dateKey(now);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d.getTime());
    days.push({ key, label: DAY_LABELS[i], active: !!log.days[key]?.sessions, today: key === today, future: key > today });
  }
  const active = days.filter((d) => d.active).length;
  return { active, goal: goalDays, reached: active >= goalDays, days };
}

export function courseStats(items, cards, now = Date.now()) {
  const list = items.map((it) => cards[it.id]);
  return {
    total: items.length,
    seen: list.filter((c) => c && c.stage > 0).length,
    learning: list.filter((c) => isLearning(c)).length,
    mastered: list.filter((c) => isMastered(c)).length,
    due: list.filter((c) => isDue(c, now)).length,
    forecast: forecast(list.filter(Boolean), now, 7),
  };
}

// Une compétence « Je peux… » est validée quand 80 % des éléments de l'unité
// ont atteint le rappel actif (niveau 3).
export function unitProgress(unit, cards) {
  const n = unit.items.length;
  const known = unit.items.filter((it) => (cards[it.id]?.stage ?? 0) >= 3).length;
  const started = unit.items.filter((it) => (cards[it.id]?.stage ?? 0) > 0).length;
  return { known, started, total: n, ratio: n ? known / n : 0, canDo: n > 0 && known / n >= 0.8 };
}

// Un niveau est terminé quand les trois quarts de ses compétences sont validées.
// Le niveau en cours (et la tenue de Bao) en découle.
export function levelStatus(course, cards) {
  const levels = course.levels.map((l) => {
    const done = l.units.filter((u) => unitProgress(u, cards).canDo).length;
    return { id: l.id, cefr: l.cefr, name: l.name, done, total: l.units.length, complete: done >= levelThreshold(l.units.length) };
  });
  let levelsDone = levels.findIndex((l) => !l.complete);
  if (levelsDone === -1) levelsDone = levels.length;
  const current = Math.min(levelsDone, levels.length - 1);
  return {
    levels,
    levelsDone,
    current,
    unitsDone: levels.reduce((a, l) => a + l.done, 0),
    ratio: levels[current].done / levelThreshold(levels[current].total),
  };
}

export function recalledCount(items, cards) {
  return items.filter((it) => (cards[it.id]?.stage ?? 0) >= 3).length;
}

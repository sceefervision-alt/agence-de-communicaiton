// Stockage local : pas de compte. La progression appartient à l'utilisateur
// et peut être exportée / importée en JSON.

import { defaultRewards } from './rewards.js';

const KEY = 'polyglotte:v1';

export function defaultState() {
  return {
    version: 1,
    settings: {
      course: 'es',
      newPerSession: 5,
      weeklyGoal: 4,
      strictAccents: false,
      audio: true,
      speaking: true,
    },
    cards: {}, // { [courseId]: { [itemId]: carte } }
    custom: {}, // { [courseId]: [{ id, fr, target, alts }] }
    extraAlts: {}, // { [courseId]: { [itemId]: [réponses acceptées par l'utilisateur] } }
    generated: {}, // { [courseId]: { [unitId]: unité générée par l'IA } }
    customLanguages: [], // langues ajoutées par leur nom
    profile: null, // { sector, goal } : choisi à l'accueil, personnalise les leçons et Bao
    rewards: defaultRewards(),
    log: { days: {} },
  };
}

export function mergeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object' || raw.version !== 1) return base;
  return {
    ...base,
    ...raw,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    cards: raw.cards ?? {},
    custom: raw.custom ?? {},
    extraAlts: raw.extraAlts ?? {},
    generated: raw.generated ?? {},
    customLanguages: Array.isArray(raw.customLanguages) ? raw.customLanguages : [],
    profile: raw.profile && typeof raw.profile === 'object' ? raw.profile : null,
    rewards: {
      ...base.rewards,
      ...(raw.rewards ?? {}),
      stats: { ...base.rewards.stats, ...(raw.rewards?.stats ?? {}) },
    },
    log: { days: raw.log?.days ?? {} },
  };
}

export function load(storage = globalThis.localStorage) {
  try {
    const text = storage?.getItem(KEY);
    return mergeState(text ? JSON.parse(text) : null);
  } catch {
    return defaultState();
  }
}

export function save(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportJSON(state) {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function importJSON(text) {
  const raw = JSON.parse(text);
  if (!raw || raw.version !== 1 || typeof raw.cards !== 'object') {
    throw new Error("Ce fichier n'est pas une sauvegarde Polyglotte valide.");
  }
  const { exportedAt, ...rest } = raw;
  return mergeState(rest);
}

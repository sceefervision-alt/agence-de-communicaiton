// Bonus : bambous, boutique de Bao, trophées et défi du jour.
// Principe : on récompense l'apprentissage réel (éléments ancrés, compétences
// validées, objectif de la semaine), jamais le simple fait de cliquer. Rien
// ne se perd : pas de pénalité, pas de série à protéger.

import { dateKey, startOfWeek } from './progress.js';
import { t, tn } from './i18n.js';

export const REWARD = {
  recalled: 1, // par élément qui atteint le rappel actif
  unit: 5, // par compétence « Je peux… » validée
  level: 20, // par niveau terminé
  weekly: 10, // objectif hebdomadaire atteint
  challenge: 5, // défi du jour
};

export const SHOP = [
  { id: 'flowers', slot: 'head', name: 'Couronne de fleurs', cost: 15 },
  { id: 'beanie', slot: 'head', name: 'Bonnet à pompon', cost: 15 },
  { id: 'cap', slot: 'head', name: 'Casquette', cost: 20 },
  { id: 'straw', slot: 'head', name: 'Chapeau de paille', cost: 25 },
  { id: 'crown', slot: 'head', name: 'Couronne dorée', cost: 60 },
  { id: 'sun', slot: 'eyes', name: 'Lunettes de soleil', cost: 20 },
  { id: 'redscarf', slot: 'neck', name: 'Écharpe rouge', cost: 15 },
  { id: 'lei', slot: 'neck', name: 'Collier de fleurs', cost: 20 },
  { id: 'goldbow', slot: 'neck', name: 'Nœud papillon doré', cost: 35 },
  { id: 'lantern', slot: 'garden', name: 'Lanterne', cost: 10 },
  { id: 'pond', slot: 'garden', name: 'Petit étang', cost: 20 },
  { id: 'bridge', slot: 'garden', name: 'Pont rouge', cost: 30 },
  { id: 'cherry', slot: 'garden', name: 'Cerisier en fleurs', cost: 40 },
  { id: 'fireflies', slot: 'garden', name: 'Lucioles', cost: 25 },
];

export const TROPHIES = [
  { id: 'first', name: 'Premiers pas', desc: 'Terminer une première session.', test: (c) => c.sessions >= 1 },
  { id: 'r10', name: 'Racines', desc: '10 éléments ancrés en mémoire.', test: (c) => c.recalled >= 10 },
  { id: 'r50', name: 'Jeune pousse', desc: '50 éléments ancrés.', test: (c) => c.recalled >= 50 },
  { id: 'r150', name: 'Bambouseraie', desc: '150 éléments ancrés.', test: (c) => c.recalled >= 150 },
  { id: 'unit', name: 'Je peux !', desc: 'Valider une première compétence.', test: (c) => c.units >= 1 },
  { id: 'a2', name: 'Niveau A2', desc: 'Terminer le niveau Débutant.', test: (c) => c.levelsDone >= 1 },
  { id: 'b1', name: 'Niveau B1', desc: 'Terminer le niveau Élémentaire.', test: (c) => c.levelsDone >= 2 },
  { id: 'b2', name: 'Niveau B2', desc: 'Terminer le niveau Intermédiaire.', test: (c) => c.levelsDone >= 3 },
  { id: 'c1', name: 'Niveau C1', desc: 'Terminer le niveau Avancé.', test: (c) => c.levelsDone >= 4 },
  { id: 'c2', name: 'Niveau C2', desc: 'Terminer le niveau Expert.', test: (c) => c.levelsDone >= 5 },
  { id: 'senior', name: 'Senior', desc: 'Terminer tout le programme.', test: (c) => c.levelsDone >= 6 },
  { id: 'week', name: 'Régulier', desc: 'Atteindre son objectif de la semaine.', test: (c) => c.weeks >= 1 },
  { id: 'week4', name: 'Bonne habitude', desc: 'Atteindre son objectif 4 semaines.', test: (c) => c.weeks >= 4 },
  { id: 'perfect', name: 'Sans faute', desc: 'Une session d’au moins 6 réponses sans erreur.', test: (c) => c.perfect >= 1 },
  { id: 'actor', name: 'En scène', desc: 'Jouer un premier jeu de rôle.', test: (c) => c.roleplays >= 1 },
  { id: 'chat', name: 'Bavard', desc: 'Converser avec Bao, le professeur IA.', test: (c) => c.chats >= 1 },
  { id: 'poly', name: 'Polyglotte', desc: 'Commencer une deuxième langue.', test: (c) => c.languages >= 2 },
  { id: 'style', name: 'Coquet', desc: 'Offrir un premier accessoire à Bao.', test: (c) => c.owned >= 1 },
];

export const CHALLENGES = [
  { id: 'learn5', text: 'Découvrir 5 nouveaux éléments', test: (s) => s.learned >= 5 },
  { id: 'correct10', text: 'Donner 10 bonnes réponses dans une session', test: (s) => s.correct >= 10 },
  { id: 'role', text: 'Jouer un jeu de rôle', test: (s) => s.mode === 'role' && s.answers > 0 },
  { id: 'perfect', text: 'Réussir une session sans erreur (6 réponses minimum)', test: (s) => s.answers >= 6 && s.wrong === 0 },
  { id: 'review', text: 'Faire une session de révision', test: (s) => s.mode === 'reviser' && s.answers > 0 },
  { id: 'write8', text: 'Écrire 8 réponses justes', test: (s) => s.written >= 8 },
  { id: 'chat', text: 'Échanger 3 répliques avec Bao, le professeur IA', test: (s) => s.mode === 'chat' && s.answers >= 3 },
];

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

export function dailyChallenge(now = Date.now()) {
  return CHALLENGES[hash(dateKey(now)) % CHALLENGES.length];
}

export function weekKey(now = Date.now()) {
  return dateKey(startOfWeek(now).getTime());
}

export function defaultRewards() {
  return {
    bamboo: 0,
    owned: [],
    equipped: {}, // { head, eyes, neck } ; 'none' = rien
    garden: [],
    trophies: {}, // { id: date }
    weeksRewarded: [],
    challenges: {}, // { dateKey: true }
    levelsRewarded: {}, // { langId: nombre de niveaux déjà récompensés }
    stats: { sessions: 0, perfect: 0, roleplays: 0, chats: 0, weeks: 0 },
  };
}

// Calcule les gains d'une session. `before` / `after` : instantanés
// { recalled, units, levelsDone } ; `summary` : bilan de la session.
export function sessionEarnings({ before, after, summary, weeklyReached, rewards, langId, now = Date.now() }) {
  const gains = [];
  const recalled = after.recalled - before.recalled;
  if (recalled > 0) gains.push({ amount: recalled * REWARD.recalled, reason: tn(recalled, '{n} élément ancré en mémoire', '{n} éléments ancrés en mémoire') });
  const units = after.units - before.units;
  if (units > 0) gains.push({ amount: units * REWARD.unit, reason: tn(units, '{n} compétence « Je peux… » validée', '{n} compétences « Je peux… » validées') });
  const levelsAlready = rewards.levelsRewarded[langId] ?? 0;
  if (after.levelsDone > levelsAlready) {
    const n = after.levelsDone - levelsAlready;
    gains.push({ amount: n * REWARD.level, reason: t('Niveau terminé !'), levelUp: true });
  }
  const wk = weekKey(now);
  if (weeklyReached && !rewards.weeksRewarded.includes(wk)) {
    const chest = 5 + (hash(wk) % 11); // coffre surprise : 5 à 15 bambous
    gains.push({ amount: REWARD.weekly, reason: t('Objectif de la semaine atteint'), weekly: true });
    gains.push({ amount: chest, reason: t('Coffre surprise de la semaine'), chest: true });
  }
  const ch = dailyChallenge(now);
  const dk = dateKey(now);
  if (!rewards.challenges[dk] && ch.test(summary)) gains.push({ amount: REWARD.challenge, reason: t('Défi du jour : {challenge}', { challenge: t(ch.text) }), challenge: true });
  return gains;
}

// Applique les gains et renvoie le nouvel état des récompenses.
export function applyEarnings(rewards, gains, { langId, levelsDone, now = Date.now() }) {
  const r = structuredClone(rewards);
  for (const g of gains) {
    r.bamboo += g.amount;
    if (g.weekly) {
      r.weeksRewarded.push(weekKey(now));
      r.stats.weeks += 1;
    }
    if (g.challenge) r.challenges[dateKey(now)] = true;
    if (g.levelUp) r.levelsRewarded[langId] = levelsDone;
  }
  return r;
}

export function newTrophies(rewards, context, now = Date.now()) {
  return TROPHIES.filter((t) => !rewards.trophies[t.id] && t.test(context)).map((t) => ({ ...t, at: dateKey(now) }));
}

export function buy(rewards, itemId) {
  const item = SHOP.find((i) => i.id === itemId);
  if (!item) throw new Error(t('Objet inconnu.'));
  if (rewards.owned.includes(itemId)) throw new Error(t('Bao a déjà cet objet.'));
  if (rewards.bamboo < item.cost) throw new Error(t('Pas encore assez de bambous.'));
  const r = structuredClone(rewards);
  r.bamboo -= item.cost;
  r.owned.push(itemId);
  if (item.slot === 'garden') r.garden.push(itemId);
  else r.equipped[item.slot] = itemId;
  return r;
}

export function toggleEquip(rewards, itemId) {
  const item = SHOP.find((i) => i.id === itemId);
  if (!item || !rewards.owned.includes(itemId)) return rewards;
  const r = structuredClone(rewards);
  if (item.slot === 'garden') {
    r.garden = r.garden.includes(itemId) ? r.garden.filter((g) => g !== itemId) : [...r.garden, itemId];
  } else {
    r.equipped[item.slot] = r.equipped[item.slot] === itemId ? undefined : itemId;
  }
  return r;
}

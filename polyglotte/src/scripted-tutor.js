// Conversation guidée avec Bao, sans IA : Bao joue le dialogue d'une unité
// (répliques « them »), l'apprenant répond librement, à l'oral ou à l'écrit.
// Une réponse juste ou proche est acceptée (avec la tournure la plus naturelle
// en correction) ; sinon Bao souffle des idées puis montre la bonne réplique.
// Gratuit, hors ligne, et même format de réponse que le professeur IA.

import { checkAnswer, normalize, stripAccents } from './answer.js';
import { t } from './i18n.js';

// Part des mots de la réplique attendue retrouvés dans la réponse, au-delà de
// laquelle on considère que l'apprenant s'est fait comprendre.
export const UNDERSTOOD = 0.6;
const MAX_ATTEMPTS = 2;

const words = (s, lang) => stripAccents(normalize(s, lang)).split(' ').filter(Boolean);

// Proportion des mots attendus présents dans la réponse (0 à 1).
export function overlap(given, expected, lang) {
  const want = words(expected, lang);
  if (!want.length) return 0;
  const have = new Set(words(given, lang));
  return want.filter((w) => have.has(w)).length / want.length;
}

const suggestion = (line) => [{ target: line.target, fr: line.fr }, ...(line.alts ?? []).slice(0, 1).map((alt) => ({ target: alt, fr: line.fr }))];

// Unités dont le dialogue permet une conversation guidée.
export const canConverse = (unit) => unit?.ready && unit.dialogue?.some((l) => l.who === 'you') && unit.dialogue.some((l) => l.who === 'them');

export function createScriptedTutor({ unit, lang }) {
  const lines = unit.dialogue;
  let index = 0;
  let attempts = 0;

  // Bao enchaîne ses répliques jusqu'au prochain tour de l'apprenant.
  function baoTurn(base = {}) {
    const said = [];
    while (index < lines.length && lines[index].who === 'them') said.push(lines[index++]);
    const next = lines[index];
    const done = !next;
    return {
      reply: said.map((l) => l.target).join(' '),
      translit: said.map((l) => l.translit).filter(Boolean).join(' '),
      translation: said.map((l) => l.fr).join(' '),
      correction: null,
      suggestions: next ? suggestion(next) : [],
      mood: done ? 'proud' : 'happy',
      note: !said.length && next ? t('À vous de commencer la conversation.') : done ? t('Conversation terminée : bravo, vous avez mené le dialogue jusqu’au bout !') : '',
      done,
      ...base,
    };
  }

  return {
    unit,
    start() {
      index = 0;
      attempts = 0;
      return baoTurn({ mood: 'wave' });
    },

    respond(text) {
      const expected = lines[index];
      if (!expected) return baoTurn();
      const accepted = [expected.target, ...(expected.alts ?? [])];
      const result = checkAnswer(text, accepted, { lang });
      const close = Math.max(...accepted.map((a) => overlap(text, a, lang)));

      if (result.status === 'wrong' && close < UNDERSTOOD && attempts + 1 < MAX_ATTEMPTS) {
        attempts += 1;
        return {
          reply: '',
          translit: '',
          translation: '',
          correction: null,
          suggestions: suggestion(expected),
          mood: 'comfort',
          note: t('Pas tout à fait. Essayez encore, par exemple avec l’une de ces idées.'),
          done: false,
          accepted: false,
        };
      }

      let correction = null;
      let mood = 'cheer';
      if (result.status === 'almost') {
        correction = { original: text, corrected: result.expected, explanation: result.message };
        mood = 'happy';
      } else if (result.status === 'wrong') {
        const understood = close >= UNDERSTOOD;
        correction = {
          original: text,
          corrected: expected.target,
          explanation: understood ? t('Compris ! Voici la tournure la plus naturelle.') : t('Voici ce qu’on pouvait répondre. On continue !'),
        };
        mood = understood ? 'happy' : 'comfort';
      }
      attempts = 0;
      index += 1;
      return baoTurn({ correction, mood, accepted: result.status !== 'wrong' || close >= UNDERSTOOD });
    },
  };
}

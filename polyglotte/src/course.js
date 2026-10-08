// Assemble un cours : le programme commun (curriculum) + le contenu écrit à la
// main (src/data) + le contenu généré par l'IA (stocké localement).

import { LEVELS } from './curriculum.js';
import { CURATED } from './data/index.js';
import { findLanguage, specialChars } from './languages.js';

export function buildCourse(langId, { generated = {}, customLanguages = [] } = {}) {
  const lang = findLanguage(langId, customLanguages);
  if (!lang) return null;
  const curated = CURATED[lang.id]?.units ?? [];
  const gen = generated[lang.id] ?? {};

  const levels = LEVELS.map((level, li) => ({
    ...level,
    index: li,
    units: level.units.map((u, ui) => {
      const hand = curated.find((c) => c.id === u.id);
      const content = hand ?? gen[u.id] ?? null;
      return {
        ...u,
        levelId: level.id,
        levelIndex: li,
        number: li * level.units.length + ui + 1,
        ready: !!content,
        source: hand ? 'curated' : content ? 'ai' : null,
        grammar: content?.grammar ?? null,
        items: content?.items ?? [],
        dialogue: content?.dialogue ?? [],
        fact: content?.fact ?? null,
      };
    }),
  }));

  return {
    id: lang.id,
    name: lang.name,
    native: lang.native,
    speechLang: lang.speechLang || gen.__meta?.speechLang || '',
    specialChars: specialChars(lang),
    rtl: !!lang.rtl,
    script: lang.script ?? null,
    curated: !!lang.curated,
    custom: !!lang.custom,
    levels,
    units: levels.flatMap((l) => l.units),
  };
}

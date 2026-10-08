// Assemble un cours : le programme commun (curriculum) + le contenu écrit à la
// main (src/data, pour les francophones) + le contenu généré par l'IA dans la
// langue de base de l'apprenant (stocké localement).
// Dans les éléments, le champ `fr` contient la phrase dans la langue de base
// (le nom vient de la première version, réservée aux francophones).

import { LEVELS } from './curriculum.js';
import { CURATED } from './data/index.js';
import { findLanguage, specialChars } from './languages.js';

// Les unités « Mon métier » dépendent du secteur de l'apprenant : leur contenu
// est rangé sous la clé « unité@secteur ». Hors français, la langue de base
// s'ajoute à la clé : « unité~en ».
export function contentKey(unit, sector, base = 'fr') {
  const key = unit.track === 'metier' ? `${unit.id}@${sector || 'general'}` : unit.id;
  return base === 'fr' ? key : `${key}~${base}`;
}

export function buildCourse(langId, { generated = {}, customLanguages = [], sector = null, base = 'fr' } = {}) {
  const lang = findLanguage(langId, customLanguages);
  if (!lang || lang.id === base) return null;
  // Le contenu écrit à la main s'adresse aux francophones.
  const curated = base === 'fr' ? CURATED[lang.id]?.units ?? [] : [];
  const gen = generated[lang.id] ?? {};

  const levels = LEVELS.map((level, li) => ({
    ...level,
    index: li,
    units: level.units.map((u, ui) => {
      const hand = u.track === 'metier' ? null : curated.find((c) => c.id === u.id);
      const key = contentKey(u, sector, base);
      const content = hand ?? gen[key] ?? null;
      return {
        ...u,
        levelId: level.id,
        levelIndex: li,
        track: u.track ?? 'daily',
        contentKey: key,
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
    base,
    curated: curated.length > 0,
    custom: !!lang.custom,
    levels,
    units: levels.flatMap((l) => l.units),
  };
}

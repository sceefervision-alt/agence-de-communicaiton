// Génération de leçons par l'IA, pour toutes les langues et tous les niveaux
// qui n'ont pas de contenu écrit à la main. Le navigateur appelle le serveur
// de Polyglotte (server.mjs), qui seul détient la clé d'API.
// La validation est partagée : le serveur et le navigateur vérifient tous deux
// la forme du contenu avant de l'utiliser.

export const DEFAULT_ENDPOINT = 'api/generate-unit';

export class GeneratorUnavailable extends Error {}

const MAX_LEN = 400;

function clean(value, max = MAX_LEN) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanList(list, max = 6) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((s) => clean(s)).filter(Boolean))].slice(0, max);
}

// Vérifie et normalise une unité ; lève une erreur si elle est inutilisable.
export function validateUnit(raw, { langId, unitId, sector = null }) {
  if (!raw || typeof raw !== 'object') throw new Error('Réponse vide.');
  if (raw.supported === false) throw new Error('Cette langue n’a pas été reconnue.');

  const grammar = {
    title: clean(raw.grammar?.title, 120),
    body: cleanList(raw.grammar?.body, 5).map((b) => b.slice(0, 300)),
  };
  if (!grammar.title || grammar.body.length === 0) throw new Error('Fiche de grammaire manquante.');

  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map((it) => {
      const target = clean(it?.target);
      const translit = clean(it?.translit);
      const alts = cleanList([...(it?.alts ?? []), translit]).filter((a) => a !== target);
      return { fr: clean(it?.fr), target, translit, alts, note: clean(it?.note, 300) };
    })
    .filter((it) => it.fr && it.target)
    .slice(0, 14)
    .map((it, i) => ({ id: `${langId}-${unitId}${sector ? `-${sector}` : ''}-${i + 1}`, ...it, note: it.note || undefined }));
  if (items.length < 6) throw new Error('Pas assez de phrases dans la leçon.');

  const dialogue = (Array.isArray(raw.dialogue) ? raw.dialogue : [])
    .map((l) => {
      const target = clean(l?.target);
      const translit = clean(l?.translit);
      return {
        who: l?.who === 'you' ? 'you' : 'them',
        target,
        translit,
        fr: clean(l?.fr),
        alts: cleanList([...(l?.alts ?? []), translit]).filter((a) => a !== target),
      };
    })
    .filter((l) => l.target && l.fr)
    .slice(0, 12);
  if (dialogue.filter((l) => l.who === 'you').length < 2) throw new Error('Dialogue incomplet.');

  return {
    id: unitId,
    grammar,
    items,
    dialogue,
    fact: clean(raw.fact, 400) || null,
    speechLang: /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(raw.speechLang ?? '') ? raw.speechLang : '',
    generatedAt: new Date().toISOString(),
  };
}

export async function requestUnit({ language, unitId, sector = null, endpoint = DEFAULT_ENDPOINT, fetchImpl = globalThis.fetch }) {
  let res;
  try {
    res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: { id: language.id, name: language.name, native: language.native }, unitId, sector }),
    });
  } catch {
    throw new Error('Connexion impossible. Vérifiez votre accès à Internet.');
  }
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    throw new GeneratorUnavailable('La génération de leçons n’est pas activée sur ce serveur.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* corps vide ou non JSON */
  }
  if (res.status === 503 && data?.error === 'not-configured') {
    throw new GeneratorUnavailable('La génération de leçons n’est pas encore configurée (clé d’API manquante).');
  }
  if (!res.ok) throw new Error(data?.message || 'La leçon n’a pas pu être préparée. Réessayez dans un instant.');
  return validateUnit(data?.unit, { langId: language.id, unitId, sector });
}

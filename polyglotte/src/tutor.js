// Bao, professeur IA : conversation orale (ou écrite) dans la langue apprise.
// Le navigateur gère le micro et la voix ; le serveur interroge Claude.

import { GeneratorUnavailable } from './generator.js';
import { t } from './i18n.js';
import { STATIC } from './env.js';

export const TUTOR_ENDPOINT = 'api/tutor';
export const MAX_TURNS = 20; // historique envoyé au serveur
export const MAX_MESSAGE = 500;

const MOODS = ['happy', 'cheer', 'think', 'comfort', 'surprise', 'wave', 'proud'];

function clean(value, max = MAX_MESSAGE) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export function trimHistory(history) {
  return history
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && clean(m.text))
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, text: clean(m.text) }));
}

export function validateTutorReply(raw) {
  const reply = clean(raw?.reply, 600);
  if (!reply) throw new Error(t('Bao n’a pas su répondre. Réessayez.'));
  const c = raw?.correction;
  const correction =
    c && clean(c.corrected) && clean(c.corrected) !== clean(c.original)
      ? { original: clean(c.original), corrected: clean(c.corrected), explanation: clean(c.explanation, 300) }
      : null;
  return {
    reply,
    translit: clean(raw?.translit, 600),
    translation: clean(raw?.translation, 600),
    correction,
    suggestions: (Array.isArray(raw?.suggestions) ? raw.suggestions : [])
      .map((s) => ({ target: clean(s?.target, 200), fr: clean(s?.base ?? s?.fr, 200) }))
      .filter((s) => s.target)
      .slice(0, 3),
    mood: MOODS.includes(raw?.mood) ? raw.mood : 'happy',
  };
}

export async function requestTutor({ language, base = 'fr', levelId, unitId, history, profile = null, endpoint = TUTOR_ENDPOINT, fetchImpl = globalThis.fetch }) {
  if (STATIC) throw new GeneratorUnavailable(t('Cet aperçu fonctionne sans serveur : l’IA n’y est pas branchée.'));
  let res;
  try {
    res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: { id: language.id, name: language.name }, base, levelId, unitId, sector: profile?.sector ?? null, goal: profile?.goal ?? null, history: trimHistory(history) }),
    });
  } catch {
    throw new Error(t('Connexion impossible. Vérifiez votre accès à Internet.'));
  }
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    throw new GeneratorUnavailable(t('Le professeur IA n’est pas activé sur ce serveur.'));
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* corps vide */
  }
  if (res.status === 503 && data?.error === 'not-configured') {
    throw new GeneratorUnavailable(t('Le professeur IA n’est pas encore configuré (clé d’API manquante).'));
  }
  if (!res.ok) throw new Error(t(data?.message || 'Bao n’a pas pu répondre. Réessayez dans un instant.'));
  return validateTutorReply(data);
}

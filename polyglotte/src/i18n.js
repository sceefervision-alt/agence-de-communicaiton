// Traduction de l'interface. Le texte source est le français, écrit en clair
// dans le code : t('Réglages'). L'anglais est traduit à la main (i18n/en.js) ;
// les autres langues sont traduites une fois par l'IA côté serveur, à partir
// du même catalogue, puis gardées en cache. Tant qu'une traduction manque,
// l'interface s'affiche en anglais.

import EN from './i18n/en.js';
import { STATIC } from './env.js';

export const CATALOG = Object.keys(EN);

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return (h >>> 0).toString(36);
}

// Change dès qu'une phrase est ajoutée ou modifiée : les traductions en cache
// sont alors refaites.
export const CATALOG_VERSION = hash(CATALOG.join('\n') + Object.values(EN).join('\n'));

const RTL = new Set(['ar', 'he', 'fa', 'ur']);
// Codes à utiliser avec Intl pour certaines langues du catalogue.
const INTL_CODE = { no: 'nb', tl: 'fil', pt: 'pt-BR' };
const intlCode = (id) => INTL_CODE[id] ?? id;

let ui = 'fr';
let table = null;
let plurals = new Intl.PluralRules('fr');

// Choisit la langue de l'interface. Hors français et anglais, il faut la table
// traduite ; sans elle, l'interface passe en anglais en attendant.
export function setUiLanguage(id, dict = null) {
  if (id === 'fr' || id === 'en') [ui, table] = [id, null];
  else if (dict) [ui, table] = [id, dict];
  else [ui, table] = ['en', null];
  try {
    plurals = new Intl.PluralRules(intlCode(ui));
  } catch {
    plurals = new Intl.PluralRules('en');
  }
  return ui;
}

export const uiLanguage = () => ui;
export const uiLocale = () => intlCode(ui);
export const isRtl = (id = ui) => RTL.has(id);

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

export function t(src, vars) {
  const s = ui === 'fr' ? src : table?.[src] ?? EN[src] ?? src;
  return vars ? fill(s, vars) : s;
}

// Marque une phrase à traduire au moment de l'afficher (constantes de module).
export const N = (src) => src;

// Singulier / pluriel selon les règles de la langue de l'interface.
export function tn(n, one, many, vars = {}) {
  return t(plurals.select(n) === 'one' ? one : many, { n, ...vars });
}

const capitalize = (s) => (s ? s[0].toLocaleUpperCase(uiLocale()) + s.slice(1) : s);

function displayName(lang) {
  try {
    const name = new Intl.DisplayNames([uiLocale()], { type: 'language' }).of(intlCode(lang.id));
    return name && name !== intlCode(lang.id) ? name : null;
  } catch {
    return null;
  }
}

// Nom d'une langue dans la langue de l'interface, en début de phrase
// (« Espagnol », « Spanish ») ou dans une phrase (« en espagnol », « in Spanish »).
export function languageName(lang) {
  if (!lang) return '';
  if (lang.custom || ui === 'fr') return lang.name;
  return capitalize(displayName(lang) ?? lang.native ?? lang.name);
}

export function languageNameInline(lang) {
  if (!lang) return '';
  if (lang.custom) return lang.name;
  if (ui === 'fr') return lang.name.toLocaleLowerCase('fr');
  return displayName(lang) ?? lang.native ?? lang.name;
}

// ---------- Contrôle des traductions produites par l'IA ----------

const TAGS = /<\/?[a-z]+>/g;
const VARS = /\{\w+\}/g;

// Une traduction doit garder les mêmes variables et les mêmes balises, sans
// rien ajouter d'autre qui ressemble à du HTML.
export function validTranslation(src, tr) {
  if (typeof tr !== 'string' || !tr.trim() || tr.length > src.length * 4 + 60) return false;
  const vars = (s) => (s.match(VARS) ?? []).sort().join('|');
  const tags = (s) => (s.match(TAGS) ?? []).join('');
  if (vars(src) !== vars(tr) || tags(src) !== tags(tr)) return false;
  return !/[<>]/.test(tr.replace(TAGS, ''));
}

export function cleanTable(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const src of CATALOG) if (validTranslation(src, raw[src])) out[src] = raw[src].trim();
  return out;
}

// ---------- Chargement d'une langue d'interface ----------

// Langues traduites à la main et livrées avec l'application (hors ligne, sans
// IA) ; les autres sont traduites par le serveur à la première visite.
export const BUILTIN = ['es', 'pt', 'de', 'it', 'ar'];

export async function loadBuiltin(lang) {
  if (!BUILTIN.includes(lang)) return null;
  try {
    return cleanTable((await import(`./i18n/${lang}.js`)).default);
  } catch {
    return null;
  }
}

const cacheKey = (lang) => `polyglotte:ui:${lang}`;

export function cachedTable(lang, storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(cacheKey(lang)) ?? 'null');
    return saved?.v === CATALOG_VERSION ? saved.strings : null;
  } catch {
    return null;
  }
}

export async function fetchTable(lang, { endpoint = 'api/ui', fetchImpl = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  if (STATIC) return null;
  try {
    const res = await fetchImpl(`${endpoint}/${encodeURIComponent(lang)}?v=${CATALOG_VERSION}`);
    if (!res.ok) return null;
    const strings = cleanTable((await res.json())?.strings);
    if (Object.keys(strings).length < CATALOG.length / 2) return null;
    try {
      storage?.setItem(cacheKey(lang), JSON.stringify({ v: CATALOG_VERSION, strings }));
    } catch {
      /* stockage plein : la table reste en mémoire */
    }
    return strings;
  } catch {
    return null;
  }
}

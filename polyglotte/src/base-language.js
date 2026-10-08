// Langue de base : choix automatique au premier lancement (d'après le pays),
// changement par l'apprenant, et application à l'interface.

import { state, persist, invalidateCourse, base, esc } from './app-state.js';
import { detectBase, browserLocale, fetchGeoCountry, isBaseLanguage, BASE_LANGUAGES } from './locale.js';
import { setUiLanguage, cachedTable, fetchTable, t, isRtl, uiLanguage, languageName } from './i18n.js';

let onChange = () => {};

// On n'apprend pas sa propre langue : la langue apprise change si besoin.
function ensureCourse() {
  if (state.settings.course === base()) state.settings.course = base() === 'en' ? 'es' : 'en';
}

// Textes fixes de la page (navigation…) : attributs data-t et data-t-label.
export function translateStatic(root = document) {
  document.documentElement.lang = uiLanguage();
  document.documentElement.dir = isRtl() ? 'rtl' : 'ltr';
  root.querySelectorAll('[data-t]').forEach((el) => (el.textContent = t(el.dataset.t)));
  root.querySelectorAll('[data-t-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.tLabel)));
}

// Hors français et anglais, la traduction de l'interface est demandée au
// serveur (une seule fois, puis gardée en cache) ; en attendant : anglais.
function applyUi() {
  const b = base();
  setUiLanguage(b, cachedTable(b));
  translateStatic();
  if (uiLanguage() === b) return;
  fetchTable(b).then((table) => {
    if (!table || base() !== b) return;
    setUiLanguage(b, table);
    translateStatic();
    onChange();
  });
}

export function initLocale({ onChange: cb } = {}) {
  if (cb) onChange = cb;
  const s = state.settings;
  if (!isBaseLanguage(s.baseLang)) {
    if (state.profile) {
      // Apprenant de la première version, entièrement en français.
      s.baseLang = 'fr';
    } else {
      const d = detectBase(browserLocale());
      Object.assign(s, { baseLang: d.base, baseAuto: true, country: d.country, countrySource: d.source });
    }
    ensureCourse();
    invalidateCourse();
    persist();
  }
  applyUi();
  // Sans région dans les réglages du navigateur, le pays de connexion (si
  // l'hébergeur le fournit) affine le choix, tant que l'apprenant n'a rien choisi.
  if (s.baseAuto && s.countrySource !== 'locale' && !state.profile) {
    fetchGeoCountry().then((geo) => {
      if (!geo || !state.settings.baseAuto || state.profile) return;
      const d = detectBase({ ...browserLocale(), geoCountry: geo });
      Object.assign(state.settings, { country: d.country, countrySource: d.source });
      if (d.base !== base()) {
        setBase(d.base, { auto: true });
        onChange();
      } else persist();
    });
  }
}

export function setBase(id, { auto = false } = {}) {
  if (!isBaseLanguage(id)) return;
  state.settings.baseLang = id;
  state.settings.baseAuto = auto;
  ensureCourse();
  invalidateCourse();
  persist();
  applyUi();
}

// Après un import de sauvegarde.
export function refreshUi() {
  if (!isBaseLanguage(state.settings.baseLang)) state.settings.baseLang = 'fr';
  ensureCourse();
  invalidateCourse();
  applyUi();
}

// Liste des langues de base, chacune écrite dans sa propre langue.
export function baseSelect(name, current = base()) {
  const sorted = [...BASE_LANGUAGES].sort((a, b) => a.native.localeCompare(b.native));
  return `<select name="${name}" id="${name}">${sorted
    .map((l) => {
      const local = languageName(l);
      return `<option value="${l.id}" ${l.id === current ? 'selected' : ''}>${esc(l.native)}${local !== l.native ? ` — ${esc(local)}` : ''}</option>`;
    })
    .join('')}</select>`;
}

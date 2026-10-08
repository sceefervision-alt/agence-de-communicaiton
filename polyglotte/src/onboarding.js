// Accueil du nouvel apprenant : langue de base (devinée d'après le pays),
// langue à apprendre, secteur professionnel, objectif.
// Le secteur personnalise les unités « Mon métier » et les conversations
// avec Bao ; tout reste modifiable dans les réglages.

import { LANGUAGES } from './languages.js';
import { SECTORS, GOALS } from './curriculum.js';
import { state, app, persist, invalidateCourse, esc, $, $$, bao, base } from './app-state.js';
import { setBase, baseSelect } from './base-language.js';
import { t, languageName, languageNameInline, uiLocale } from './i18n.js';
import { confetti } from './confetti.js';

const POPULAR = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ar', 'ru', 'nl', 'ko', 'tr'];

let draft = null;

export function renderWelcome() {
  document.body.classList.add('onboarding');
  draft ??= {
    step: 0,
    course: state.settings.course,
    sector: state.profile?.sector ?? null,
    goal: state.profile?.goal ?? 'travel',
    weekly: state.settings.weeklyGoal,
  };
  if (draft.course === base()) draft.course = state.settings.course;
  const steps = [stepHello, stepLanguage, stepSector, stepGoal, stepDone];
  steps[draft.step]();
}

function frame({ mood, bubble, body, step }) {
  const dots = [1, 2, 3].map((i) => `<span class="${i <= step ? 'on' : ''}"></span>`).join('');
  app.innerHTML = `
    <section class="welcome">
      <div class="welcome-bao">${bao(mood, 190, { live: true })}<div class="speech">${bubble}</div></div>
      ${step ? `<div class="steps" aria-label="${esc(t('Étape {n} sur 3', { n: step }))}">${dots}</div>` : ''}
      <div class="welcome-body">${body}</div>
    </section>`;
}

const go = (delta) => {
  draft.step += delta;
  renderWelcome();
};

function countryName() {
  const country = state.settings.country;
  if (!country || !state.settings.baseAuto) return '';
  try {
    return new Intl.DisplayNames([uiLocale()], { type: 'region' }).of(country) ?? '';
  } catch {
    return '';
  }
}

function stepHello() {
  const country = countryName();
  frame({
    mood: 'hello',
    step: 0,
    bubble: t('Bonjour ! Je suis <strong>Bao</strong>, votre professeur de langues. Je vais vous aider à parler avec aisance en voyage et au travail.'),
    body: `
      <h1>${t('Apprenez la langue de vos voyages et de vos clients')}</h1>
      <p class="muted">${t('Toutes les langues, du débutant au niveau senior, avec un vocabulaire pensé pour les professionnels qui voyagent.')}</p>
      <label class="field base-pick"><span>${t('Je parle')}</span>${baseSelect('base-pick')}
        ${country ? `<span class="small muted">${esc(t('Choisie automatiquement d’après votre pays : {country}.', { country }))}</span>` : ''}</label>
      <button class="btn primary big" id="next">${t('Faire connaissance — 30 secondes')}</button>`,
  });
  // Changer de langue de base retraduit aussitôt tout l'accueil.
  $('#base-pick').addEventListener('change', (e) => {
    setBase(e.target.value);
    if (draft.course === base()) draft.course = state.settings.course;
    renderWelcome();
  });
  $('#next').addEventListener('click', () => go(1));
}

function stepLanguage() {
  const langs = POPULAR.filter((id) => id !== base())
    .slice(0, 12)
    .map((id) => LANGUAGES.find((l) => l.id === id))
    .filter(Boolean);
  frame({
    mood: 'wave',
    step: 1,
    bubble: t('Quelle langue voulez-vous parler ?'),
    body: `
      <div class="choice-grid">${langs
        .map((l) => `<button class="choice ${draft.course === l.id ? 'on' : ''}" data-v="${l.id}"><strong dir="auto">${esc(l.native)}</strong><span>${esc(languageName(l))}</span></button>`)
        .join('')}</div>
      <p class="small muted">${t('45 langues disponibles, et toute autre sur demande : vous pourrez changer à tout moment.')}</p>
      <div class="row actions"><button class="btn ghost" id="back">${t('Retour')}</button><button class="btn primary" id="next">${t('Continuer')}</button></div>`,
  });
  $$('.choice').forEach((b) =>
    b.addEventListener('click', () => {
      draft.course = b.dataset.v;
      $$('.choice').forEach((x) => x.classList.toggle('on', x === b));
    }),
  );
  $('#back').addEventListener('click', () => go(-1));
  $('#next').addEventListener('click', () => go(1));
}

function stepSector() {
  frame({
    mood: 'think',
    step: 2,
    bubble: t('Dans quel secteur travaillez-vous ? Je vous apprendrai le vocabulaire de votre métier.'),
    body: `
      <div class="choice-grid sectors">${SECTORS.map((s) => `<button class="choice ${draft.sector === s.id ? 'on' : ''}" data-v="${s.id}"><span>${esc(t(s.name))}</span></button>`).join('')}</div>
      <div class="row actions"><button class="btn ghost" id="back">${t('Retour')}</button><button class="btn ghost" id="skip">${t('Je préfère ne pas préciser')}</button><button class="btn primary" id="next">${t('Continuer')}</button></div>`,
  });
  $$('.choice').forEach((b) =>
    b.addEventListener('click', () => {
      draft.sector = b.dataset.v;
      $$('.choice').forEach((x) => x.classList.toggle('on', x === b));
    }),
  );
  $('#back').addEventListener('click', () => go(-1));
  $('#skip').addEventListener('click', () => {
    draft.sector = null;
    go(1);
  });
  $('#next').addEventListener('click', () => go(1));
}

function stepGoal() {
  frame({
    mood: 'happy',
    step: 3,
    bubble: t('Qu’est-ce qui vous motive ? Et combien de jours par semaine voulez-vous pratiquer ?'),
    body: `
      <div class="choice-list">${GOALS.map((g) => `<button class="choice ${draft.goal === g.id ? 'on' : ''}" data-v="${g.id}"><span>${esc(t(g.name))}</span></button>`).join('')}</div>
      <div class="weekly-pick" role="group" aria-label="${esc(t('Jours par semaine'))}">
        ${[2, 3, 4, 5, 7].map((n) => `<button class="choice small ${draft.weekly === n ? 'on' : ''}" data-w="${n}">${t('{n} j / sem.', { n })}</button>`).join('')}
      </div>
      <p class="small muted">${t('Un objectif par semaine, pas par jour : les jours de repos ne vous font rien perdre.')}</p>
      <div class="row actions"><button class="btn ghost" id="back">${t('Retour')}</button><button class="btn primary" id="next">${t('Terminer')}</button></div>`,
  });
  $$('[data-v]').forEach((b) =>
    b.addEventListener('click', () => {
      draft.goal = b.dataset.v;
      $$('[data-v]').forEach((x) => x.classList.toggle('on', x === b));
    }),
  );
  $$('[data-w]').forEach((b) =>
    b.addEventListener('click', () => {
      draft.weekly = Number(b.dataset.w);
      $$('[data-w]').forEach((x) => x.classList.toggle('on', x === b));
    }),
  );
  $('#back').addEventListener('click', () => go(-1));
  $('#next').addEventListener('click', () => {
    state.settings.course = draft.course;
    state.settings.weeklyGoal = draft.weekly;
    state.profile = { sector: draft.sector, goal: draft.goal };
    invalidateCourse();
    persist();
    go(1);
  });
}

function stepDone() {
  const lang = LANGUAGES.find((l) => l.id === draft.course);
  frame({
    mood: 'cheer',
    step: 0,
    bubble: esc(t('C’est parti ! Je vous ai préparé un parcours sur mesure en {language}.', { language: languageNameInline(lang) })),
    body: `<button class="btn primary big" id="start">${t('Commencer ma première leçon')}</button>`,
  });
  confetti();
  $('#start').addEventListener('click', () => {
    draft = null;
    document.body.classList.remove('onboarding');
    location.hash = '#/';
  });
}

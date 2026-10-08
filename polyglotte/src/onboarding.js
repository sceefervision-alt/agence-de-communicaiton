// Accueil du nouvel apprenant : langue, secteur professionnel, objectif.
// Le secteur personnalise les unités « Mon métier » et les conversations
// avec Bao ; tout reste modifiable dans les réglages.

import { LANGUAGES } from './languages.js';
import { SECTORS, GOALS } from './curriculum.js';
import { state, app, persist, invalidateCourse, esc, $, $$, bao } from './app-state.js';
import { confetti } from './confetti.js';

const POPULAR = ['en', 'es', 'de', 'it', 'pt', 'zh', 'ja', 'ar', 'ru', 'nl', 'ko', 'tr'];

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
  const steps = [stepHello, stepLanguage, stepSector, stepGoal, stepDone];
  steps[draft.step]();
}

function frame({ mood, bubble, body, step }) {
  const dots = [1, 2, 3].map((i) => `<span class="${i <= step ? 'on' : ''}"></span>`).join('');
  app.innerHTML = `
    <section class="welcome">
      <div class="welcome-bao">${bao(mood, 190, { live: true })}<div class="speech">${bubble}</div></div>
      ${step ? `<div class="steps" aria-label="Étape ${step} sur 3">${dots}</div>` : ''}
      <div class="welcome-body">${body}</div>
    </section>`;
}

const go = (delta) => {
  draft.step += delta;
  renderWelcome();
};

function stepHello() {
  frame({
    mood: 'hello',
    step: 0,
    bubble: 'Bonjour ! Je suis <strong>Bao</strong>, votre professeur de langues. Je vais vous aider à parler avec aisance en voyage et au travail.',
    body: `
      <h1>Apprenez la langue de vos voyages et de vos clients</h1>
      <p class="muted">Toutes les langues, du débutant au niveau senior, avec un vocabulaire pensé pour les professionnels qui voyagent.</p>
      <button class="btn primary big" id="next">Faire connaissance — 30 secondes</button>`,
  });
  $('#next').addEventListener('click', () => go(1));
}

function stepLanguage() {
  const langs = POPULAR.map((id) => LANGUAGES.find((l) => l.id === id)).filter(Boolean);
  frame({
    mood: 'wave',
    step: 1,
    bubble: 'Quelle langue voulez-vous parler ?',
    body: `
      <div class="choice-grid">${langs
        .map((l) => `<button class="choice ${draft.course === l.id ? 'on' : ''}" data-v="${l.id}"><strong dir="auto">${esc(l.native)}</strong><span>${esc(l.name)}</span></button>`)
        .join('')}</div>
      <p class="small muted">45 langues disponibles, et toute autre sur demande : vous pourrez changer à tout moment.</p>
      <div class="row actions"><button class="btn ghost" id="back">Retour</button><button class="btn primary" id="next">Continuer</button></div>`,
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
    bubble: 'Dans quel secteur travaillez-vous ? Je vous apprendrai le vocabulaire de votre métier.',
    body: `
      <div class="choice-grid sectors">${SECTORS.map((s) => `<button class="choice ${draft.sector === s.id ? 'on' : ''}" data-v="${s.id}"><span>${esc(s.name)}</span></button>`).join('')}</div>
      <div class="row actions"><button class="btn ghost" id="back">Retour</button><button class="btn ghost" id="skip">Je préfère ne pas préciser</button><button class="btn primary" id="next">Continuer</button></div>`,
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
    bubble: 'Qu’est-ce qui vous motive ? Et combien de jours par semaine voulez-vous pratiquer ?',
    body: `
      <div class="choice-list">${GOALS.map((g) => `<button class="choice ${draft.goal === g.id ? 'on' : ''}" data-v="${g.id}"><span>${esc(g.name)}</span></button>`).join('')}</div>
      <div class="weekly-pick" role="group" aria-label="Jours par semaine">
        ${[2, 3, 4, 5, 7].map((n) => `<button class="choice small ${draft.weekly === n ? 'on' : ''}" data-w="${n}">${n} j / sem.</button>`).join('')}
      </div>
      <p class="small muted">Un objectif par semaine, pas par jour : les jours de repos ne vous font rien perdre.</p>
      <div class="row actions"><button class="btn ghost" id="back">Retour</button><button class="btn primary" id="next">Terminer</button></div>`,
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
    bubble: `C’est parti ! Je vous ai préparé un parcours sur mesure en ${esc((lang?.name ?? '').toLowerCase())}.`,
    body: `<button class="btn primary big" id="start">Commencer ma première leçon</button>`,
  });
  confetti();
  $('#start').addEventListener('click', () => {
    draft = null;
    document.body.classList.remove('onboarding');
    location.hash = '#/';
  });
}

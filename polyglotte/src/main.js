import * as store from './storage.js';
import { LANGUAGES, customLanguage } from './languages.js';
import { requestUnit, GeneratorUnavailable } from './generator.js';
import { weeklyStatus, courseStats, unitProgress, dateKey } from './progress.js';
import { dailyChallenge } from './rewards.js';
import { canSpeak, canRecognize, speak } from './speech.js';
import {
  state, app, persist, replaceState, invalidateCourse, esc, $, $$, toast, icon, bambooIcon, course, cards, custom, items,
  langName, courseName, base, baseLanguage, caps, bao, baoSays, level, stage, audioBtn, bindAudio, targetText, weekWidget, updateBambooCounter,
} from './app-state.js';
import { t, tn, languageName, languageNameInline, uiLocale } from './i18n.js';
import { initLocale, setBase, refreshUi, baseSelect } from './base-language.js';
import { startSession, endSession, sessionActive } from './session-view.js';
import { renderChat, endChat } from './chat-view.js';
import { renderBao, gardenScene } from './bao-view.js';
import { renderWelcome } from './onboarding.js';
import { playSplash } from './splash.js';
import { load3D } from './visual.js';
import { startSky, renderSky } from './sky.js';
import { STATIC } from './env.js';
import { SECTORS, GOALS, TRACKS, trackOf, levelThreshold, findSector } from './curriculum.js';

// ---------- Routeur ----------

const routes = [
  [/^#\/?$/, renderHome],
  [/^#\/parcours$/, renderPath],
  [/^#\/unite\/([\w-]+)$/, renderUnit],
  [/^#\/session\/(apprendre|reviser|role|test)(?:\/([\w-]+))?$/, startSession],
  [/^#\/converser(?:\/([\w-]+))?$/, renderChat],
  [/^#\/bao$/, renderBao],
  [/^#\/langues$/, renderLanguages],
  [/^#\/vocabulaire$/, renderVocab],
  [/^#\/reglages$/, renderSettings],
  [/^#\/pourquoi$/, renderWhy],
  [/^#\/bienvenue$/, renderWelcome],
];

function router() {
  const hash = location.hash || '#/';
  if (sessionActive() && !hash.startsWith('#/session')) endSession();
  if (!hash.startsWith('#/converser')) endChat();
  document.body.classList.remove('in-session');
  if (!hash.startsWith('#/bienvenue')) document.body.classList.remove('onboarding');
  document.body.dataset.level = String(stage());
  updateBambooCounter();
  renderSky();
  for (const [re, fn] of routes) {
    const m = hash.match(re);
    if (m) {
      const section = hash.split('/')[1] || 'home';
      $$('[data-nav]', document).forEach((a) => {
        const active = a.dataset.nav === section || (section === 'unite' && a.dataset.nav === 'parcours') || (section === 'langues' && a.dataset.nav === 'home');
        if (active) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      fn(...m.slice(1));
      app.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      return;
    }
  }
  location.hash = '#/';
}

// ---------- Accueil ----------

function nextUnitToLearn() {
  const lv = level();
  for (const l of course().levels.slice(lv.current)) {
    const u = l.units.find((x) => !x.ready || x.items.some((it) => (cards()[it.id]?.stage ?? 0) === 0));
    if (u) return u;
  }
  return null;
}

function renderHome() {
  const c = course();
  const stats = courseStats(items(), cards(), Date.now());
  const lv = level();
  const lvData = c.levels[lv.current];
  const nextUnit = nextUnitToLearn();
  const week = weeklyStatus(state.log, state.settings.weeklyGoal, Date.now());
  const challenge = dailyChallenge();
  const challengeDone = !!state.rewards.challenges[dateKey()];
  const st = stage();
  const nextLevel = c.levels[lv.current + 1];

  // Bao s'adresse à l'apprenant selon la situation (geste + phrase courte).
  let mood = 'hello';
  let message = t('Prêt pour quelques minutes ensemble ?');
  if (stats.seen === 0) message = t('Bonjour ! Je suis Bao, votre professeur. On commence l’aventure en {language} ?', { language: langName() });
  else if (stats.due > 0) {
    mood = 'read';
    message = tn(stats.due, 'J’ai préparé {n} révision pour vous. Juste ce qu’il faut, au bon moment.', 'J’ai préparé {n} révisions pour vous. Juste ce qu’il faut, au bon moment.');
  } else if (week.reached) {
    mood = 'cheer';
    message = t('Objectif de la semaine atteint ! Tout le reste, c’est du bonus.');
  } else if (!nextUnit) {
    mood = 'proud';
    message = t('Tout est à jour. On discute un peu ?');
  }

  // L'interface s'enrichit avec l'apprenant : certains blocs n'apparaissent
  // qu'une fois qu'ils ont du sens.
  const showStats = stats.seen > 0;
  const showForecast = stats.seen >= 5;

  app.innerHTML = `
    <section class="card hero level-${st}">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">${esc(lvData.cefr)} · ${esc(t(lvData.name))}</p>
          <h1>${esc(courseName())}</h1>
          <a class="lang-link" href="#/langues">${icon('globe', 16)} ${t('Changer de langue')}</a>
        </div>
        ${baoSays(mood, esc(message), { size: 128, className: 'hero-bao' })}
      </div>
      <div class="stack hero-actions">
        ${stats.due > 0 ? `<a class="btn primary block" href="#/session/reviser">${tn(stats.due, 'Réviser maintenant — {n} élément', 'Réviser maintenant — {n} éléments')}</a>` : ''}
        ${nextUnit ? `<a class="btn ${stats.due > 0 ? '' : 'primary'} block" href="#/unite/${nextUnit.id}">${esc(t(stats.seen ? 'Continuer : {unit}' : 'Commencer : {unit}', { unit: t(nextUnit.title) }))}</a>` : ''}
        <a class="btn block" href="#/converser">${icon('mic')} ${t('Converser avec Bao, le professeur IA')}</a>
      </div>
    </section>

    <section class="card level-card">
      <div class="row spread">
        <div><p class="eyebrow">${t('Votre progression')}</p><h2>${esc(t('Niveau {level}', { level: `${lvData.cefr} · ${t(lvData.name)}` }))}</h2></div>
        <span class="badge">${t('{done} / {total} compétences', { done: lv.levels[lv.current].done, total: levelThreshold(lvData.units.length) })}</span>
      </div>
      <div class="bar"><span style="width:${Math.min(100, Math.round(lv.ratio * 100))}%"></span></div>
      ${state.profile?.sector ? `<p class="small muted profile-line">${t('Parcours personnalisé')} · ${esc(t(findSector(state.profile.sector)?.name ?? ''))} · <a href="#/reglages">${t('modifier')}</a></p>` : `<p class="small muted profile-line"><a href="#/bienvenue">${t('Indiquez votre métier')}</a> ${t('pour un vocabulaire sur mesure.')}</p>`}
      ${
        nextLevel
          ? `<div class="next-gift">${bao('happy', 64, { stage: Math.min(5, st + 1) })}<p class="small">${t('Au niveau <strong>{level}</strong>, Bao recevra une nouvelle tenue et son jardin changera de ciel.', { level: esc(nextLevel.cefr) })}</p></div>`
          : `<p class="small">${t('Vous avez atteint le sommet du programme. Bao vous tire son chapeau !')}</p>`
      }
    </section>

    <section class="card challenge ${challengeDone ? 'done' : ''}">
      ${bao(challengeDone ? 'cheer' : 'think', 72)}
      <div>
        <p class="eyebrow">${t(challengeDone ? 'Défi du jour · réussi' : 'Défi du jour')}</p>
        <p class="challenge-text">${esc(t(challenge.text))}</p>
        <p class="small muted">${challengeDone ? t('Bravo ! Revenez demain pour un nouveau défi.') : `${t('Bonus :')} ${bambooIcon(14)} ${t('+5 bambous. Facultatif, sans pression.')}`}</p>
      </div>
    </section>

    <section class="card">${weekWidget()}</section>

    <section class="card">
      <div class="row spread"><h2>${t('Le jardin de Bao')}</h2><a class="small" href="#/bao">${t('Boutique et trophées')} ${icon('right', 14)}</a></div>
      ${gardenScene()}
    </section>

    ${
      showStats
        ? `<section class="grid">
      <div class="card stat"><div class="num">${stats.mastered}</div><div class="label">${t('éléments maîtrisés')}<br><span class="small">${t('(révision espacée ≥ 3 semaines)')}</span></div></div>
      <div class="card stat"><div class="num">${stats.learning}</div><div class="label">${t('en cours d’apprentissage')}</div></div>
      <div class="card stat"><div class="num">${stats.due}</div><div class="label">${t('à réviser aujourd’hui')}</div></div>
      <div class="card stat"><div class="num">${lv.unitsDone}</div><div class="label">${t('compétences « Je peux… » validées')}</div></div>
    </section>`
        : ''
    }
    ${showForecast ? forecastCard(stats) : ''}
    <p><a href="#/pourquoi">${t('Pourquoi Polyglotte est différent de Duolingo')} ${icon('right', 14)}</a></p>
  `;
}

function forecastCard(stats) {
  const maxF = Math.max(1, ...stats.forecast);
  const dayNames = [
    t('Auj.'),
    t('Dem.'),
    ...Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 2);
      return d.toLocaleDateString(uiLocale(), { weekday: 'short' });
    }),
  ];
  return `<section class="card">
    <h2>${t('Révisions à venir')}</h2>
    <p class="muted small">${t('La répétition espacée vous montre ce qui arrive : pas de surprise, pas de pile cachée.')}</p>
    <div class="forecast" aria-label="${esc(t('Prévision des révisions sur 7 jours'))}">
      ${stats.forecast.map((n, i) => `<div><span style="height:${Math.round((n / maxF) * 54)}px"></span>${n}<br>${esc(dayNames[i])}</div>`).join('')}
    </div>
  </section>`;
}

// ---------- Langues ----------

function languageCard(l) {
  const started = Object.keys(state.cards[l.id] ?? {}).length;
  const active = l.id === course().id;
  const name = languageName(l);
  const offline = l.curated && base() === 'fr';
  return `<button class="lang-card ${active ? 'active' : ''}" data-lang="${esc(l.id)}" data-search="${esc(`${name} ${l.name} ${l.native}`.toLowerCase())}">
    <span class="lang-native" dir="auto">${esc(l.native)}</span>
    <span class="lang-name">${esc(name)}</span>
    <span class="lang-meta">${offline ? `<span class="badge ok">${t('A1 hors ligne')}</span>` : `<span class="badge">${t(STATIC ? 'Bientôt' : 'Leçons par IA')}</span>`}${started ? `<span class="badge">${t('{n} vus', { n: started })}</span>` : ''}</span>
  </button>`;
}

function renderLanguages() {
  // On n'apprend pas sa propre langue de base.
  const list = [...LANGUAGES, ...state.customLanguages].filter((l) => l.id !== base());
  app.innerHTML = `
    ${baoSays('wave', esc(t('Quelle langue voulez-vous apprendre ? Toutes sont possibles, du niveau débutant au niveau senior.')), { size: 110 })}
    <h1>${t('Toutes les langues')}</h1>
    <p class="muted small base-line">${icon('globe', 14)} ${t('Leçons et traductions en {language}.', { language: esc(languageName(baseLanguage())) })} <a href="#/reglages">${t('Changer ma langue')}</a></p>
    <label class="field"><span class="sr-only">${t('Rechercher une langue')}</span><input type="text" id="lang-search" placeholder="${esc(t('Rechercher : japonais, swahili, grec…'))}" autocomplete="off" /></label>
    <div class="lang-grid" id="lang-grid">${list.map(languageCard).join('')}</div>
    <form class="card" id="custom-lang">
      <h2>${t('Une autre langue ?')}</h2>
      <p class="muted small">${t('Créole, langue régionale, langue rare… Donnez son nom : Bao préparera les leçons avec l’IA, du niveau A1 au niveau C2.')}</p>
      <div class="row"><input type="text" name="name" maxlength="40" placeholder="${esc(t('ex. Tamoul, Quechua, Corse'))}" class="grow text-input" required /><button class="btn primary" type="submit">${t('Ajouter')}</button></div>
    </form>
    <p class="muted small">${base() === 'fr' ? t('Les langues marquées « A1 hors ligne » ont un niveau débutant écrit à la main. Les autres leçons sont préparées par l’IA puis vérifiées automatiquement ; vous pouvez toujours faire accepter une réponse juste.') : t('Les leçons sont préparées par l’IA dans votre langue, puis vérifiées automatiquement ; vous pouvez toujours faire accepter une réponse juste.')}</p>`;
  $('#lang-search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    $$('.lang-card').forEach((el) => (el.hidden = !!q && !el.dataset.search.includes(q)));
  });
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => chooseLanguage(b.dataset.lang)));
  $('#custom-lang').addEventListener('submit', (e) => {
    e.preventDefault();
    const lang = customLanguage(new FormData(e.currentTarget).get('name'));
    if (!lang) return toast(t('Nom de langue invalide.'));
    const wanted = lang.name.toLowerCase();
    const known = LANGUAGES.find((l) => [l.name, l.native, languageName(l)].some((n) => n.toLowerCase() === wanted));
    if (known) return chooseLanguage(known.id);
    if (!state.customLanguages.some((l) => l.id === lang.id)) state.customLanguages.push(lang);
    chooseLanguage(lang.id);
  });
}

function chooseLanguage(id) {
  state.settings.course = id;
  invalidateCourse();
  persist();
  location.hash = '#/';
}

// ---------- Parcours ----------

// Le parcours serpente comme un sentier : chaque compétence est une étape
// ronde, décalée à gauche puis à droite. Bao se tient au bord du chemin.
const NODE_OFFSETS = [0, 52, 84, 52, 0, -52, -84, -52];
const TRACK_ICON = { daily: 'star', pro: 'briefcase', metier: 'tool' };

function pathNode(u, ui, nextId) {
  const p = unitProgress(u, cards());
  const track = trackOf(u);
  const isNext = u.id === nextId;
  const state = p.canDo ? 'done' : isNext ? 'next' : u.ready && p.known > 0 ? 'started' : 'todo';
  const status = !u.ready ? t(STATIC ? 'Bientôt' : 'À préparer') : p.canDo ? t('Validée') : `${p.known} / ${p.total}`;
  const face = state === 'done' ? icon('check', 30) : !u.ready ? icon('sparkle', 28) : icon(TRACK_ICON[track], 28);
  return `<li class="path-step" style="--x:${NODE_OFFSETS[ui % NODE_OFFSETS.length]}px">
    <a class="node node-${state} track-${track}" href="#/unite/${u.id}" style="--p:${Math.round(p.ratio * 100)}" aria-label="${esc(`${t('Unité {n}', { n: u.number })} : ${t(u.title)} — ${status}`)}">
      <span class="node-face">${face}</span>
      ${isNext ? `<span class="node-tip">${t(p.known ? 'Continuer' : 'Commencer')}</span>` : ''}
    </a>
    <span class="node-label">${esc(t(u.title))}</span>
  </li>`;
}

function renderPath() {
  const c = course();
  const lv = level();
  const perso = custom();
  const current = c.levels[lv.current];
  const next = current.units.find((u) => !unitProgress(u, cards()).canDo) ?? current.units[0];
  app.innerHTML = `
    <p class="eyebrow">${esc(courseName())}</p><h1>${t('Parcours')}</h1>
    <p class="muted">${t('Du niveau débutant (A1) au niveau senior (C2). Toutes les unités sont ouvertes : commencez par ce qui vous sert, et validez en une minute ce que vous savez déjà.')}</p>
    <ul class="legend">${Object.keys(TRACKS)
      .map((k) => `<li class="track-${k}"><span class="dot">${icon(TRACK_ICON[k], 14)}</span>${esc(t(TRACKS[k].name))}${k === 'metier' && state.profile?.sector ? ` · ${esc(t(findSector(state.profile.sector)?.name ?? ''))}` : ''}</li>`)
      .join('')}</ul>
    ${c.levels
      .map((l, li) => {
        const info = lv.levels[li];
        const cls = info.complete ? 'complete' : li === lv.current ? 'current' : li > lv.current ? 'later' : '';
        const status = info.complete ? t('terminé') : li === lv.current ? t('en cours') : '';
        return `<section class="level-section ${cls}">
          <header class="level-banner level-${li}">
            <div class="grow"><p class="eyebrow">${esc(l.cefr)}${status ? ` · ${status}` : ''}</p><h2>${esc(t(l.name))}</h2><p>${esc(t(l.tagline))}</p></div>
            <span class="level-count">${info.done} / ${info.total}</span>
          </header>
          <div class="path">
            <div class="path-bao ${li % 2 ? 'left' : 'right'}">${bao(info.complete ? 'proud' : li === lv.current ? 'hello' : 'sleep', 110, { stage: li, live: false })}</div>
            <ol class="path-nodes">${l.units.map((u, ui) => pathNode(u, ui, li === lv.current ? next.id : null)).join('')}</ol>
          </div>
        </section>`;
      })
      .join('')}
    <a class="card unit vocab-card" href="#/vocabulaire">
      <span class="vocab-icon">${icon('book', 26)}</span>
      <div class="grow"><div class="row spread"><h3>${t('Mon vocabulaire')}</h3><span class="badge">${tn(perso.length, '{n} mot', '{n} mots')}</span></div>
      <p>${t('Vos propres mots, intégrés à la répétition espacée.')}</p></div>
    </a>`;
}

// ---------- Unité ----------

function renderUnit(unitId) {
  const u = course().units.find((x) => x.id === unitId);
  if (!u) return (location.hash = '#/parcours');
  if (!u.ready) return renderUnitGeneration(u);

  const p = unitProgress(u, cards());
  const fresh = u.items.filter((it) => (cards()[it.id]?.stage ?? 0) === 0).length;
  const levelLabel = (st) => t(['Nouveau', 'Découvert', 'Reconnu', 'Rappel', 'Production', 'Production'][st] ?? 'Nouveau');
  const lvl = course().levels[u.levelIndex];

  app.innerHTML = `
    <p><a class="back" href="#/parcours">${icon('left', 14)} ${t('Parcours')}</a></p>
    <p class="eyebrow">${esc(lvl.cefr)} · ${esc(t(TRACKS[trackOf(u)].name))} · ${t('Unité {n}', { n: u.number })}</p>
    <h1>${esc(t(u.title))}</h1>
    <p class="row"><span class="badge ${p.canDo ? 'ok' : ''}">${p.canDo ? icon('check', 14) : ''} ${esc(t(u.canDo))}</span>${u.source === 'ai' ? `<span class="badge">${t('Préparée par l’IA')}</span>` : ''}</p>
    <div class="stack actions" style="margin-bottom:18px">
      <a class="btn primary block" href="#/session/apprendre/${u.id}">${fresh ? tn(fresh, 'Apprendre ({n} nouvel élément)', 'Apprendre ({n} nouveaux éléments)') : t('Retravailler cette unité')}</a>
      <div class="row">
        <a class="btn" href="#/session/role/${u.id}">${icon('dialogue')} ${t('Jeu de rôle')}</a>
        <a class="btn" href="#/converser/${u.id}">${icon('mic')} ${t('En parler avec Bao')}</a>
        ${p.canDo ? '' : `<a class="btn" href="#/session/test/${u.id}">${icon('target')} ${t('Je connais déjà')}</a>`}
      </div>
    </div>

    <section class="card grammar with-bao">
      ${bao('read', 92)}
      <div><h2>${t('Comprendre :')} ${esc(u.grammar.title)}</h2>
      <ul>${u.grammar.body.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
    </section>

    <section class="card">
      <div class="row spread"><h2>${t('En situation')}</h2><button class="btn ghost" id="toggle-tr">${t('Masquer la traduction')}</button></div>
      <ul class="dialogue">
        ${u.dialogue.map((l) => `<li class="${l.who}"><div class="bubble">${targetText(l.target, l.translit)} ${audioBtn(l.target)}<span class="tr">${esc(l.fr)}</span></div></li>`).join('')}
      </ul>
      ${caps().audio ? `<button class="btn" id="play-all">${icon('play', 16)} ${t('Écouter tout le dialogue')}</button>` : ''}
    </section>

    ${
      u.fact
        ? p.canDo
          ? `<section class="card fact">${bao('surprise', 80)}<div><p class="eyebrow">${t('Bonus débloqué · Le saviez-vous ?')}</p><p>${esc(u.fact)}</p></div></section>`
          : `<section class="card fact locked">${bao('think', 80)}<div><p class="eyebrow">${icon('lock', 12)} ${t('Bonus · Le saviez-vous ?')}</p><p class="muted">${t('Validez cette compétence pour découvrir l’anecdote culturelle de Bao.')}</p></div></section>`
        : ''
    }

    <section class="card">
      <h2>${t('Phrases de l’unité')}</h2>
      <ul class="item-list">
        ${u.items
          .map((it) => {
            const st = cards()[it.id]?.stage ?? 0;
            return `<li><span>${targetText(it.target, it.translit)} ${audioBtn(it.target)}<br><span class="muted small">${esc(it.fr)}</span></span><span class="badge ${st >= 3 ? 'ok' : ''}">${levelLabel(st)}</span></li>`;
          })
          .join('')}
      </ul>
    </section>`;
  bindAudio();
  $('#toggle-tr').addEventListener('click', (e) => {
    const hidden = $$('.tr').some((el) => el.hidden);
    $$('.tr').forEach((el) => (el.hidden = !hidden));
    e.currentTarget.textContent = t(hidden ? 'Masquer la traduction' : 'Afficher la traduction');
  });
  $('#play-all')?.addEventListener('click', async () => {
    for (const l of u.dialogue) {
      if (location.hash !== `#/unite/${u.id}`) break;
      await speak(l.target, course().speechLang);
    }
  });
}

function renderUnitGeneration(u) {
  const lvl = course().levels[u.levelIndex];
  // Version gratuite : seules les leçons écrites à l'avance existent.
  if (STATIC) {
    app.innerHTML = `
      <p><a class="back" href="#/parcours">${icon('left', 14)} ${t('Parcours')}</a></p>
      <p class="eyebrow">${esc(lvl.cefr)} · ${t('Unité {n}', { n: u.number })}</p>
      <h1>${esc(t(u.title))}</h1>
      <section class="card center generate">
        ${bao('comfort', 140)}
        <h2>${t('Leçon bientôt disponible')}</h2>
        <p class="muted">${esc(t(u.canDo))}<br>${t('Cette leçon n’est pas encore disponible hors ligne : elle arrivera dans une prochaine mise à jour.')}</p>
        <a class="btn primary" href="#/parcours">${t('Voir le parcours')}</a>
      </section>`;
    return;
  }
  app.innerHTML = `
    <p><a class="back" href="#/parcours">${icon('left', 14)} ${t('Parcours')}</a></p>
    <p class="eyebrow">${esc(lvl.cefr)} · ${t('Unité {n}', { n: u.number })}</p>
    <h1>${esc(t(u.title))}</h1>
    <section class="card center generate" id="gen">
      ${bao('write', 150)}
      <h2>${t('Bao va préparer cette leçon')}</h2>
      <p class="muted">${esc(t(u.canDo))}<br>${esc(t('Phrases utiles, fiche de grammaire, dialogue et anecdote culturelle en {language}, adaptés au niveau {level}.', { language: langName(), level: lvl.cefr }))}</p>
      <button class="btn primary" id="generate">${icon('sparkle')} ${t('Préparer la leçon')}</button>
      <p class="small muted">${t('Cela prend environ une minute. Une fois prête, la leçon reste disponible hors ligne.')}</p>
    </section>`;
  $('#generate').addEventListener('click', () => generate(u));
}

async function generate(u) {
  const box = $('#gen');
  box.innerHTML = `${bao('write', 150)}<h2>${t('Bao écrit votre leçon…')}</h2><p class="muted">${t('Il choisit les phrases, vérifie la grammaire et prépare le dialogue.')}</p><p class="typing"><span></span><span></span><span></span></p>`;
  const lang = { id: course().id, name: course().name, native: course().native };
  try {
    const sector = u.track === 'metier' ? state.profile?.sector ?? null : null;
    const unit = await requestUnit({ language: lang, unitId: u.id, sector: sector ?? (u.track === 'metier' ? 'general' : null), base: course().base });
    state.generated[lang.id] ??= {};
    state.generated[lang.id][u.contentKey] = unit;
    if (unit.speechLang && !state.generated[lang.id].__meta) state.generated[lang.id].__meta = { speechLang: unit.speechLang };
    invalidateCourse();
    persist();
    toast(t('Leçon prête !'));
    if (location.hash === `#/unite/${u.id}`) renderUnit(u.id);
  } catch (err) {
    if (!document.body.contains(box)) return;
    const unavailable = err instanceof GeneratorUnavailable;
    box.innerHTML = `${bao('comfort', 140)}<h2>${t(unavailable ? 'Leçon bientôt disponible' : 'Oups, la leçon n’a pas pu être préparée')}</h2>
      <p class="muted">${esc(err.message)}</p>
      ${unavailable ? `<p class="small muted">${t('Pour l’activer, la personne qui héberge Polyglotte doit définir la variable ANTHROPIC_API_KEY puis lancer <code>npm start</code>.')} ${base() === 'fr' ? t('En attendant, les langues marquées « A1 hors ligne » fonctionnent entièrement.') : ''}</p>` : `<button class="btn primary" id="retry">${t('Réessayer')}</button>`}`;
    $('#retry')?.addEventListener('click', () => generate(u));
  }
}

// ---------- Vocabulaire personnel ----------

function renderVocab() {
  const list = custom();
  app.innerHTML = `
    ${baoSays('write', t('Notez ici les mots dont <em>vous</em> avez besoin : travail, voyage, passions. Je les ferai réviser au bon moment.'), { size: 100 })}
    <p class="eyebrow">${esc(courseName())}</p><h1>${t('Mon vocabulaire')}</h1>
    <form class="card" id="vocab-form">
      <label class="field"><span>${esc(t('En {language}', { language: languageNameInline(baseLanguage()) }))}</span><input type="text" name="fr" required maxlength="120" dir="auto" placeholder="${esc(t('ex. un rendez-vous'))}" /></label>
      <label class="field"><span>${esc(t('En {language}', { language: langName() }))}</span><input type="text" name="target" required maxlength="120" dir="auto" lang="${esc(course().speechLang)}" /></label>
      <label class="field"><span>${t('Autres réponses acceptées')} <span class="muted small">${t('(facultatif, séparées par ;)')}</span></span><input type="text" name="alts" maxlength="240" dir="auto" /></label>
      <button class="btn primary" type="submit">${t('Ajouter')}</button>
    </form>
    ${
      list.length
        ? `<section class="card">
            <div class="row spread"><h2>${tn(list.length, '{n} mot', '{n} mots')}</h2><a class="btn primary" href="#/session/apprendre/perso">${t('Apprendre mes mots')}</a></div>
            <ul class="item-list">${list
              .map((it) => `<li><span>${targetText(it.target)} ${audioBtn(it.target)}<br><span class="muted small">${esc(it.fr)}</span></span><button class="btn ghost" data-del="${esc(it.id)}" aria-label="${esc(t('Supprimer {word}', { word: it.target }))}">${t('Supprimer')}</button></li>`)
              .join('')}</ul>
          </section>`
        : ''
    }`;
  bindAudio();
  $('#vocab-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fr = String(f.get('fr')).trim();
    const target = String(f.get('target')).trim();
    if (!fr || !target) return;
    const alts = String(f.get('alts') ?? '').split(';').map((s) => s.trim()).filter(Boolean);
    custom().push({ id: `perso-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, fr, target, alts });
    persist();
    toast(t('Mot ajouté.'));
    renderVocab();
    $('input[name="fr"]').focus();
  });
  $$('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      state.custom[course().id] = custom().filter((it) => it.id !== b.dataset.del);
      delete cards()[b.dataset.del];
      persist();
      renderVocab();
    }),
  );
}

// ---------- Réglages ----------

function renderSettings() {
  const s = state.settings;
  app.innerHTML = `
    <h1>${t('Réglages')}</h1>
    <form class="card" id="settings">
      <label class="field"><span>${t('Ma langue (interface, traductions et explications)')}</span>
        ${baseSelect('baseLang')}
        <span class="muted small">${esc(baseHint())}</span>
      </label>
      <div class="field"><span>${t('Langue apprise')}</span><a class="btn" href="#/langues">${icon('globe')} ${esc(t('{language} — changer', { language: courseName() }))}</a></div>
      <label class="field"><span>${t('Mon secteur professionnel')}</span>
        <select name="sector"><option value="">${t('Non précisé')}</option>${SECTORS.map((x) => `<option value="${x.id}" ${state.profile?.sector === x.id ? 'selected' : ''}>${esc(t(x.name))}</option>`).join('')}</select>
      </label>
      <label class="field"><span>${t('Mon objectif')}</span>
        <select name="goal">${GOALS.map((x) => `<option value="${x.id}" ${state.profile?.goal === x.id ? 'selected' : ''}>${esc(t(x.name))}</option>`).join('')}</select>
      </label>
      <label class="field"><span>${t('Nouveaux éléments par session')}</span>
        <input type="number" name="newPerSession" min="1" max="10" value="${s.newPerSession}" />
      </label>
      <label class="field"><span>${t('Objectif : jours d’entraînement par semaine')}</span>
        <input type="number" name="weeklyGoal" min="1" max="7" value="${s.weeklyGoal}" />
      </label>
      <label class="check"><input type="checkbox" name="audio" ${s.audio ? 'checked' : ''} ${canSpeak() ? '' : 'disabled'} />
        <span>${t('Audio (écoute, dictée et voix de Bao)')}${canSpeak() ? '' : ` — ${t('non disponible dans ce navigateur')}`}</span></label>
      <label class="check"><input type="checkbox" name="speaking" ${s.speaking ? 'checked' : ''} ${canRecognize() ? '' : 'disabled'} />
        <span>${t('Micro (exercices oraux et conversation avec Bao)')}${canRecognize() ? '' : ` — ${t('non disponible dans ce navigateur (essayez Chrome ou Edge)')}`}</span></label>
      <label class="check"><input type="checkbox" name="strictAccents" ${s.strictAccents ? 'checked' : ''} />
        <span>${t('Mode strict : un accent manquant compte comme une erreur')}</span></label>
    </form>

    <section class="card">
      <h2>${t('Vos données')}</h2>
      <p class="muted small">${t('Pas de compte : votre progression, vos bambous et vos leçons restent sur cet appareil. Exportez-les pour les sauvegarder ou les transférer.')}</p>
      <div class="row">
        <button class="btn" id="export">${icon('download')} ${t('Exporter')}</button>
        <label class="btn">${icon('upload')} ${t('Importer')}<input type="file" id="import" accept="application/json" hidden /></label>
        <button class="btn ghost" id="reset">${esc(t('Réinitialiser : {language}', { language: courseName() }))}</button>
      </div>
    </section>`;

  $('#settings').addEventListener('change', (e) => {
    const el = e.target;
    if (el.name === 'baseLang') {
      setBase(el.value).then(() => {
        toast(t('Réglage enregistré.'));
        renderSettings();
      });
      return;
    }
    if (el.name === 'sector' || el.name === 'goal') {
      state.profile = { ...(state.profile ?? {}), [el.name]: el.value || null };
      invalidateCourse();
    } else if (el.type === 'checkbox') s[el.name] = el.checked;
    else if (el.type === 'number') s[el.name] = Math.min(Number(el.max), Math.max(Number(el.min), Number(el.value) || 1));
    persist();
    toast(t('Réglage enregistré.'));
  });
  $('#export').addEventListener('click', () => {
    const blob = new Blob([store.exportJSON(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `polyglotte-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('#import').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      replaceState(store.importJSON(await file.text()));
      persist();
      await refreshUi();
      toast(t('Progression importée.'));
      renderSettings();
    } catch (err) {
      toast(err.message);
    }
  });
  $('#reset').addEventListener('click', () => {
    if (!confirm(t('Effacer toute votre progression en {language} ? Vos bambous et trophées sont conservés.', { language: langName() }))) return;
    state.cards[course().id] = {};
    persist();
    toast(t('Progression réinitialisée.'));
  });
}

// ---------- Pourquoi ----------

function renderWhy() {
  const points = [
    [t('Un vrai professeur qui vous parle'), t('Bao, le professeur IA, converse avec vous à l’oral dans la langue apprise, corrige avec bienveillance et vous souffle des idées de réponse.')],
    [t('Toutes les langues, du débutant au senior'), t('Plus de 45 langues au catalogue, et n’importe quelle autre sur simple demande, sur un programme commun de A1 à C2.')],
    [t('Dans votre langue'), t('L’interface, les traductions et les explications s’adaptent automatiquement à votre pays. Vous pouvez la changer à tout moment.')],
    [t('Pas de vies, pas de cœurs'), t('Une erreur ne vous bloque jamais : l’élément revient simplement plus loin dans la session.')],
    [t('Un objectif hebdomadaire, pas une série quotidienne'), t('Vous choisissez combien de jours par semaine. Les jours de repos ne vous font rien perdre.')],
    [t('Des bonus qui récompensent l’apprentissage'), t('Les bambous se gagnent en ancrant des mots et en validant des compétences, jamais en cliquant ou en payant.')],
    [t('Produire, pas seulement reconnaître'), t('Chaque élément progresse : découverte → choix → écoute → rappel écrit → dictée et oral.')],
    [t('Des corrections qui expliquent'), t('Accent, faute de frappe, article, ordre des mots, mot manquant : on vous dit précisément quoi. Et si votre réponse était juste, vous pouvez la faire accepter.')],
    [t('La grammaire expliquée'), t('Chaque unité a sa fiche « Comprendre », et chaque erreur affiche la règle concernée.')],
    [t('Des situations réelles'), t('Café, ville, entretien, débat… avec un dialogue à écouter et un jeu de rôle.')],
    [t('Liberté de parcours'), t('Toutes les unités sont ouvertes. Un test d’une minute permet de valider ce que vous savez déjà.')],
    [t('Répétition espacée transparente'), t('Vous voyez ce qui est à réviser et ce qui arrive dans la semaine.')],
    [t('Vos données vous appartiennent'), t('Sans compte, utilisable hors ligne, progression exportable.')],
  ];
  app.innerHTML = `
    ${baoSays('proud', esc(t('Polyglotte part des critiques les plus fréquentes faites à Duolingo et y répond une par une.')), { size: 110 })}
    <h1>${t('Pourquoi Polyglotte ?')}</h1>
    <section class="card"><ul class="why">${points.map(([title, d]) => `<li><strong>${esc(title)}</strong><span class="muted">${esc(d)}</span></li>`).join('')}</ul></section>
    <a class="btn primary" href="#/">${t('Commencer')}</a>`;
}

// ---------- Langue de base ----------

function baseHint() {
  const country = state.settings.country;
  let name = '';
  try {
    name = country ? new Intl.DisplayNames([uiLocale()], { type: 'region' }).of(country) ?? '' : '';
  } catch {
    /* Intl incomplet */
  }
  return state.settings.baseAuto && name ? t('Choisie automatiquement d’après votre pays : {country}.', { country: name }) : t('Les leçons déjà préparées dans une autre langue restent disponibles si vous revenez à celle-ci.');
}

// ---------- Démarrage ----------

// Un événement périmé (navigation rapide) ne doit pas rafraîchir la page une
// seconde fois : on ignore ceux qui ne correspondent plus à l'adresse actuelle.
window.addEventListener('hashchange', (e) => {
  if (new URL(e.newURL).hash === location.hash) router();
});
// Un lien vers la page déjà affichée (« Continuer l'unité », « Nouvelle
// conversation ») ne déclenche pas de hashchange : on relance la vue.
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href^="#"]');
  if (a && a.getAttribute('href') === location.hash) {
    e.preventDefault();
    router();
  }
});

// Ouverture : la langue de base est choisie d'après le pays, l'application se
// prépare derrière l'animation de Bao, puis un nouvel apprenant est accueilli
// par le questionnaire de bienvenue.
await initLocale({ onChange: router });
startSky();
if (!state.profile && !location.hash.startsWith('#/bienvenue')) location.replace('#/bienvenue');
router();
load3D();
playSplash({ stage: stage(), equipped: state.rewards.equipped });

// Hors ligne grâce au service worker, sauf dans un aperçu intégré qui l'interdit.
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !globalThis.POLYGLOTTE_NO_SW) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

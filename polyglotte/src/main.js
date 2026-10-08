import * as store from './storage.js';
import { LANGUAGES, customLanguage } from './languages.js';
import { requestUnit, GeneratorUnavailable } from './generator.js';
import { weeklyStatus, courseStats, unitProgress, dateKey } from './progress.js';
import { dailyChallenge } from './rewards.js';
import { canSpeak, canRecognize, speak } from './speech.js';
import {
  state, app, persist, replaceState, invalidateCourse, esc, $, $$, toast, icon, bambooIcon, plural, course, cards, custom, items,
  langName, caps, bao, baoSays, level, stage, audioBtn, bindAudio, targetText, weekWidget, updateBambooCounter,
} from './app-state.js';
import { startSession, endSession, sessionActive } from './session-view.js';
import { renderChat, endChat } from './chat-view.js';
import { renderBao, gardenScene } from './bao-view.js';

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
];

function router() {
  const hash = location.hash || '#/';
  if (sessionActive() && !hash.startsWith('#/session')) endSession();
  if (!hash.startsWith('#/converser')) endChat();
  document.body.classList.remove('in-session');
  document.body.dataset.level = String(stage());
  updateBambooCounter();
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
  let message = 'Prêt pour quelques minutes ensemble ?';
  if (stats.seen === 0) message = `Bonjour ! Je suis Bao, votre professeur. On commence l’aventure en ${langName()} ?`;
  else if (stats.due > 0) {
    mood = 'read';
    message = `J’ai préparé ${plural(stats.due, 'révision', 'révisions')} pour vous. Juste ce qu’il faut, au bon moment.`;
  } else if (week.reached) {
    mood = 'cheer';
    message = 'Objectif de la semaine atteint ! Tout le reste, c’est du bonus.';
  } else if (!nextUnit) {
    mood = 'proud';
    message = 'Tout est à jour. On discute un peu ?';
  }

  // L'interface s'enrichit avec l'apprenant : certains blocs n'apparaissent
  // qu'une fois qu'ils ont du sens.
  const showStats = stats.seen > 0;
  const showForecast = stats.seen >= 5;

  app.innerHTML = `
    <section class="card hero level-${st}">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">${esc(lvData.cefr)} · ${esc(lvData.name)}</p>
          <h1>${esc(c.name)}</h1>
          <a class="lang-link" href="#/langues">${icon('globe', 16)} Changer de langue</a>
        </div>
        ${baoSays(mood, esc(message), { size: 128, className: 'hero-bao' })}
      </div>
      <div class="stack hero-actions">
        ${stats.due > 0 ? `<a class="btn primary block" href="#/session/reviser">Réviser maintenant — ${plural(stats.due, 'élément', 'éléments')}</a>` : ''}
        ${nextUnit ? `<a class="btn ${stats.due > 0 ? '' : 'primary'} block" href="#/unite/${nextUnit.id}">${stats.seen ? 'Continuer' : 'Commencer'} : ${esc(nextUnit.title)}</a>` : ''}
        <a class="btn block" href="#/converser">${icon('mic')} Converser avec Bao, le professeur IA</a>
      </div>
    </section>

    <section class="card level-card">
      <div class="row spread">
        <div><p class="eyebrow">Votre progression</p><h2>Niveau ${esc(lvData.cefr)} · ${esc(lvData.name)}</h2></div>
        <span class="badge">${lv.levels[lv.current].done} / ${Math.ceil(lvData.units.length * 0.8)} compétences</span>
      </div>
      <div class="bar"><span style="width:${Math.min(100, Math.round(lv.ratio * 100))}%"></span></div>
      ${
        nextLevel
          ? `<div class="next-gift">${bao('happy', 64, { stage: Math.min(5, st + 1) })}<p class="small">Au niveau <strong>${esc(nextLevel.cefr)}</strong>, Bao recevra une nouvelle tenue et son jardin changera de ciel.</p></div>`
          : '<p class="small">Vous avez atteint le sommet du programme. Bao vous tire son chapeau !</p>'
      }
    </section>

    <section class="card challenge ${challengeDone ? 'done' : ''}">
      ${bao(challengeDone ? 'cheer' : 'think', 72)}
      <div>
        <p class="eyebrow">Défi du jour${challengeDone ? ' · réussi' : ''}</p>
        <p class="challenge-text">${esc(challenge.text)}</p>
        <p class="small muted">${challengeDone ? 'Bravo ! Revenez demain pour un nouveau défi.' : `Bonus : ${bambooIcon(14)} +5 bambous. Facultatif, sans pression.`}</p>
      </div>
    </section>

    <section class="card">${weekWidget()}</section>

    <section class="card">
      <div class="row spread"><h2>Le jardin de Bao</h2><a class="small" href="#/bao">Boutique et trophées ${icon('right', 14)}</a></div>
      ${gardenScene()}
    </section>

    ${
      showStats
        ? `<section class="grid">
      <div class="card stat"><div class="num">${stats.mastered}</div><div class="label">éléments maîtrisés<br><span class="small">(révision espacée ≥ 3 semaines)</span></div></div>
      <div class="card stat"><div class="num">${stats.learning}</div><div class="label">en cours d’apprentissage</div></div>
      <div class="card stat"><div class="num">${stats.due}</div><div class="label">à réviser aujourd’hui</div></div>
      <div class="card stat"><div class="num">${lv.unitsDone}</div><div class="label">compétences « Je peux… » validées</div></div>
    </section>`
        : ''
    }
    ${showForecast ? forecastCard(stats) : ''}
    <p><a href="#/pourquoi">Pourquoi Polyglotte est différent de Duolingo ${icon('right', 14)}</a></p>
  `;
}

function forecastCard(stats) {
  const maxF = Math.max(1, ...stats.forecast);
  const dayNames = [
    'Auj.',
    'Dem.',
    ...Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 2);
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    }),
  ];
  return `<section class="card">
    <h2>Révisions à venir</h2>
    <p class="muted small">La répétition espacée vous montre ce qui arrive : pas de surprise, pas de pile cachée.</p>
    <div class="forecast" aria-label="Prévision des révisions sur 7 jours">
      ${stats.forecast.map((n, i) => `<div><span style="height:${Math.round((n / maxF) * 54)}px"></span>${n}<br>${esc(dayNames[i])}</div>`).join('')}
    </div>
  </section>`;
}

// ---------- Langues ----------

function languageCard(l) {
  const started = Object.keys(state.cards[l.id] ?? {}).length;
  const active = l.id === course().id;
  return `<button class="lang-card ${active ? 'active' : ''}" data-lang="${esc(l.id)}" data-search="${esc(`${l.name} ${l.native}`.toLowerCase())}">
    <span class="lang-native" dir="auto">${esc(l.native)}</span>
    <span class="lang-name">${esc(l.name)}</span>
    <span class="lang-meta">${l.curated ? '<span class="badge ok">A1 hors ligne</span>' : '<span class="badge">Leçons par IA</span>'}${started ? `<span class="badge">${started} vus</span>` : ''}</span>
  </button>`;
}

function renderLanguages() {
  app.innerHTML = `
    ${baoSays('wave', 'Quelle langue voulez-vous apprendre ? Toutes sont possibles, du niveau débutant au niveau senior.', { size: 110 })}
    <h1>Toutes les langues</h1>
    <label class="field"><span class="sr-only">Rechercher une langue</span><input type="text" id="lang-search" placeholder="Rechercher : japonais, swahili, grec…" autocomplete="off" /></label>
    <div class="lang-grid" id="lang-grid">${[...LANGUAGES, ...state.customLanguages].map(languageCard).join('')}</div>
    <form class="card" id="custom-lang">
      <h2>Une autre langue ?</h2>
      <p class="muted small">Créole, langue régionale, langue rare… Donnez son nom : Bao préparera les leçons avec l’IA, du niveau A1 au niveau C2.</p>
      <div class="row"><input type="text" name="name" maxlength="40" placeholder="ex. Tamoul, Quechua, Corse" class="grow text-input" required /><button class="btn primary" type="submit">Ajouter</button></div>
    </form>
    <p class="muted small">Les langues marquées « A1 hors ligne » ont un niveau débutant écrit à la main. Les autres leçons sont préparées par l’IA puis vérifiées automatiquement ; vous pouvez toujours faire accepter une réponse juste.</p>`;
  $('#lang-search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    $$('.lang-card').forEach((el) => (el.hidden = !!q && !el.dataset.search.includes(q)));
  });
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => chooseLanguage(b.dataset.lang)));
  $('#custom-lang').addEventListener('submit', (e) => {
    e.preventDefault();
    const lang = customLanguage(new FormData(e.currentTarget).get('name'));
    if (!lang) return toast('Nom de langue invalide.');
    const known = LANGUAGES.find((l) => l.name.toLowerCase() === lang.name.toLowerCase());
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

function renderPath() {
  const c = course();
  const lv = level();
  const perso = custom();
  app.innerHTML = `
    <p class="eyebrow">${esc(c.name)}</p><h1>Parcours</h1>
    <p class="muted">Du niveau débutant (A1) au niveau senior (C2). Toutes les unités sont ouvertes : commencez par ce qui vous sert, et validez en une minute ce que vous savez déjà.</p>
    ${c.levels
      .map((l, li) => {
        const info = lv.levels[li];
        const cls = info.complete ? 'complete' : li === lv.current ? 'current' : li > lv.current ? 'later' : '';
        return `<section class="level-section ${cls}">
          <header class="level-head">
            <div class="level-bao">${bao(info.complete ? 'proud' : li === lv.current ? 'hello' : 'sleep', 72, { stage: li })}</div>
            <div class="grow"><p class="eyebrow">${esc(l.cefr)}${info.complete ? ' · terminé' : li === lv.current ? ' · en cours' : ''}</p><h2>${esc(l.name)}</h2><p class="muted small">${esc(l.tagline)}</p></div>
            <span class="badge ${info.complete ? 'ok' : ''}">${info.done} / ${info.total}</span>
          </header>
          ${l.units
            .map((u) => {
              const p = unitProgress(u, cards());
              return `<a class="card unit" href="#/unite/${u.id}">
                <div class="row spread"><h3><span class="unit-num">${String(u.number).padStart(2, '0')}</span>${esc(u.title)}</h3>
                ${!u.ready ? '<span class="badge">À préparer</span>' : p.canDo ? `<span class="badge ok">${icon('check', 14)} Validée</span>` : `<span class="badge">${p.known} / ${p.total}</span>`}</div>
                <p>${esc(u.canDo)}</p>
                ${u.ready ? `<div class="bar" aria-hidden="true"><span style="width:${Math.round(p.ratio * 100)}%"></span></div>` : ''}
              </a>`;
            })
            .join('')}
        </section>`;
      })
      .join('')}
    <a class="card unit" href="#/vocabulaire">
      <div class="row spread"><h3>Mon vocabulaire</h3><span class="badge">${perso.length} mot${perso.length > 1 ? 's' : ''}</span></div>
      <p>Vos propres mots, intégrés à la répétition espacée.</p>
    </a>`;
}

// ---------- Unité ----------

function renderUnit(unitId) {
  const u = course().units.find((x) => x.id === unitId);
  if (!u) return (location.hash = '#/parcours');
  if (!u.ready) return renderUnitGeneration(u);

  const p = unitProgress(u, cards());
  const fresh = u.items.filter((it) => (cards()[it.id]?.stage ?? 0) === 0).length;
  const levelLabel = (st) => ['Nouveau', 'Découvert', 'Reconnu', 'Rappel', 'Production', 'Production'][st] ?? 'Nouveau';
  const lvl = course().levels[u.levelIndex];

  app.innerHTML = `
    <p><a class="back" href="#/parcours">${icon('left', 14)} Parcours</a></p>
    <p class="eyebrow">${esc(lvl.cefr)} · Unité ${u.number}</p>
    <h1>${esc(u.title)}</h1>
    <p class="row"><span class="badge ${p.canDo ? 'ok' : ''}">${p.canDo ? icon('check', 14) : ''} ${esc(u.canDo)}</span>${u.source === 'ai' ? '<span class="badge">Préparée par l’IA</span>' : ''}</p>
    <div class="stack actions" style="margin-bottom:18px">
      <a class="btn primary block" href="#/session/apprendre/${u.id}">${fresh ? `Apprendre (${plural(fresh, 'nouvel élément', 'nouveaux éléments')})` : 'Retravailler cette unité'}</a>
      <div class="row">
        <a class="btn" href="#/session/role/${u.id}">${icon('dialogue')} Jeu de rôle</a>
        <a class="btn" href="#/converser/${u.id}">${icon('mic')} En parler avec Bao</a>
        ${p.canDo ? '' : `<a class="btn" href="#/session/test/${u.id}">${icon('target')} Je connais déjà</a>`}
      </div>
    </div>

    <section class="card grammar with-bao">
      ${bao('read', 92)}
      <div><h2>Comprendre : ${esc(u.grammar.title)}</h2>
      <ul>${u.grammar.body.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
    </section>

    <section class="card">
      <div class="row spread"><h2>En situation</h2><button class="btn ghost" id="toggle-tr">Masquer la traduction</button></div>
      <ul class="dialogue">
        ${u.dialogue.map((l) => `<li class="${l.who}"><div class="bubble">${targetText(l.target, l.translit)} ${audioBtn(l.target)}<span class="tr">${esc(l.fr)}</span></div></li>`).join('')}
      </ul>
      ${caps().audio ? `<button class="btn" id="play-all">${icon('play', 16)} Écouter tout le dialogue</button>` : ''}
    </section>

    ${
      u.fact
        ? p.canDo
          ? `<section class="card fact">${bao('surprise', 80)}<div><p class="eyebrow">Bonus débloqué · Le saviez-vous ?</p><p>${esc(u.fact)}</p></div></section>`
          : `<section class="card fact locked">${bao('think', 80)}<div><p class="eyebrow">${icon('lock', 12)} Bonus · Le saviez-vous ?</p><p class="muted">Validez cette compétence pour découvrir l’anecdote culturelle de Bao.</p></div></section>`
        : ''
    }

    <section class="card">
      <h2>Phrases de l’unité</h2>
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
    e.currentTarget.textContent = hidden ? 'Masquer la traduction' : 'Afficher la traduction';
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
  app.innerHTML = `
    <p><a class="back" href="#/parcours">${icon('left', 14)} Parcours</a></p>
    <p class="eyebrow">${esc(lvl.cefr)} · Unité ${u.number}</p>
    <h1>${esc(u.title)}</h1>
    <section class="card center generate" id="gen">
      ${bao('write', 150)}
      <h2>Bao va préparer cette leçon</h2>
      <p class="muted">${esc(u.canDo)}<br>Phrases utiles, fiche de grammaire, dialogue et anecdote culturelle en ${esc(langName())}, adaptés au niveau ${esc(lvl.cefr)}.</p>
      <button class="btn primary" id="generate">${icon('sparkle')} Préparer la leçon</button>
      <p class="small muted">Cela prend environ une minute. Une fois prête, la leçon reste disponible hors ligne.</p>
    </section>`;
  $('#generate').addEventListener('click', () => generate(u));
}

async function generate(u) {
  const box = $('#gen');
  box.innerHTML = `${bao('write', 150)}<h2>Bao écrit votre leçon…</h2><p class="muted">Il choisit les phrases, vérifie la grammaire et prépare le dialogue.</p><p class="typing"><span></span><span></span><span></span></p>`;
  const lang = { id: course().id, name: course().name, native: course().native };
  try {
    const unit = await requestUnit({ language: lang, unitId: u.id });
    state.generated[lang.id] ??= {};
    state.generated[lang.id][u.id] = unit;
    if (unit.speechLang && !state.generated[lang.id].__meta) state.generated[lang.id].__meta = { speechLang: unit.speechLang };
    invalidateCourse();
    persist();
    toast('Leçon prête !');
    if (location.hash === `#/unite/${u.id}`) renderUnit(u.id);
  } catch (err) {
    if (!document.body.contains(box)) return;
    const unavailable = err instanceof GeneratorUnavailable;
    box.innerHTML = `${bao('comfort', 140)}<h2>${unavailable ? 'Leçon bientôt disponible' : 'Oups, la leçon n’a pas pu être préparée'}</h2>
      <p class="muted">${esc(err.message)}</p>
      ${unavailable ? '<p class="small muted">Pour l’activer, la personne qui héberge Polyglotte doit définir la variable ANTHROPIC_API_KEY puis lancer <code>npm start</code>. En attendant, les langues marquées « A1 hors ligne » fonctionnent entièrement.</p>' : '<button class="btn primary" id="retry">Réessayer</button>'}`;
    $('#retry')?.addEventListener('click', () => generate(u));
  }
}

// ---------- Vocabulaire personnel ----------

function renderVocab() {
  const list = custom();
  app.innerHTML = `
    ${baoSays('write', 'Notez ici les mots dont <em>vous</em> avez besoin : travail, voyage, passions. Je les ferai réviser au bon moment.', { size: 100 })}
    <p class="eyebrow">${esc(course().name)}</p><h1>Mon vocabulaire</h1>
    <form class="card" id="vocab-form">
      <label class="field"><span>En français</span><input type="text" name="fr" required maxlength="120" placeholder="ex. un rendez-vous" /></label>
      <label class="field"><span>En ${esc(langName())}</span><input type="text" name="target" required maxlength="120" dir="auto" lang="${esc(course().speechLang)}" /></label>
      <label class="field"><span>Autres réponses acceptées <span class="muted small">(facultatif, séparées par ;)</span></span><input type="text" name="alts" maxlength="240" dir="auto" /></label>
      <button class="btn primary" type="submit">Ajouter</button>
    </form>
    ${
      list.length
        ? `<section class="card">
            <div class="row spread"><h2>${plural(list.length, 'mot', 'mots')}</h2><a class="btn primary" href="#/session/apprendre/perso">Apprendre mes mots</a></div>
            <ul class="item-list">${list
              .map((it) => `<li><span>${targetText(it.target)} ${audioBtn(it.target)}<br><span class="muted small">${esc(it.fr)}</span></span><button class="btn ghost" data-del="${esc(it.id)}" aria-label="Supprimer ${esc(it.target)}">Supprimer</button></li>`)
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
    toast('Mot ajouté.');
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
    <h1>Réglages</h1>
    <form class="card" id="settings">
      <div class="field"><span>Langue apprise</span><a class="btn" href="#/langues">${icon('globe')} ${esc(course().name)} — changer</a></div>
      <label class="field"><span>Nouveaux éléments par session</span>
        <input type="number" name="newPerSession" min="1" max="10" value="${s.newPerSession}" />
      </label>
      <label class="field"><span>Objectif : jours d’entraînement par semaine</span>
        <input type="number" name="weeklyGoal" min="1" max="7" value="${s.weeklyGoal}" />
      </label>
      <label class="check"><input type="checkbox" name="audio" ${s.audio ? 'checked' : ''} ${canSpeak() ? '' : 'disabled'} />
        <span>Audio (écoute, dictée et voix de Bao)${canSpeak() ? '' : ' — non disponible dans ce navigateur'}</span></label>
      <label class="check"><input type="checkbox" name="speaking" ${s.speaking ? 'checked' : ''} ${canRecognize() ? '' : 'disabled'} />
        <span>Micro (exercices oraux et conversation avec Bao)${canRecognize() ? '' : ' — non disponible dans ce navigateur (essayez Chrome ou Edge)'}</span></label>
      <label class="check"><input type="checkbox" name="strictAccents" ${s.strictAccents ? 'checked' : ''} />
        <span>Mode strict : un accent manquant compte comme une erreur</span></label>
    </form>

    <section class="card">
      <h2>Vos données</h2>
      <p class="muted small">Pas de compte : votre progression, vos bambous et vos leçons restent sur cet appareil. Exportez-les pour les sauvegarder ou les transférer.</p>
      <div class="row">
        <button class="btn" id="export">${icon('download')} Exporter</button>
        <label class="btn">${icon('upload')} Importer<input type="file" id="import" accept="application/json" hidden /></label>
        <button class="btn ghost" id="reset">Réinitialiser ${esc(langName())}</button>
      </div>
    </section>`;

  $('#settings').addEventListener('change', (e) => {
    const el = e.target;
    if (el.type === 'checkbox') s[el.name] = el.checked;
    else if (el.type === 'number') s[el.name] = Math.min(Number(el.max), Math.max(Number(el.min), Number(el.value) || 1));
    persist();
    toast('Réglage enregistré.');
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
      toast('Progression importée.');
      renderSettings();
    } catch (err) {
      toast(err.message);
    }
  });
  $('#reset').addEventListener('click', () => {
    if (!confirm(`Effacer toute votre progression en ${langName()} ? Vos bambous et trophées sont conservés.`)) return;
    state.cards[course().id] = {};
    persist();
    toast('Progression réinitialisée.');
  });
}

// ---------- Pourquoi ----------

function renderWhy() {
  const points = [
    ['Un vrai professeur qui vous parle', 'Bao, le professeur IA, converse avec vous à l’oral dans la langue apprise, corrige avec bienveillance et vous souffle des idées de réponse.'],
    ['Toutes les langues, du débutant au senior', 'Plus de 45 langues au catalogue, et n’importe quelle autre sur simple demande, sur un programme commun de A1 à C2.'],
    ['Pas de vies, pas de cœurs', 'Une erreur ne vous bloque jamais : l’élément revient simplement plus loin dans la session.'],
    ['Un objectif hebdomadaire, pas une série quotidienne', 'Vous choisissez combien de jours par semaine. Les jours de repos ne vous font rien perdre.'],
    ['Des bonus qui récompensent l’apprentissage', 'Les bambous se gagnent en ancrant des mots et en validant des compétences, jamais en cliquant ou en payant.'],
    ['Produire, pas seulement reconnaître', 'Chaque élément progresse : découverte → choix → écoute → rappel écrit → dictée et oral.'],
    ['Des corrections qui expliquent', 'Accent, faute de frappe, article, ordre des mots, mot manquant : on vous dit précisément quoi. Et si votre réponse était juste, vous pouvez la faire accepter.'],
    ['La grammaire expliquée', 'Chaque unité a sa fiche « Comprendre », et chaque erreur affiche la règle concernée.'],
    ['Des situations réelles', 'Café, ville, entretien, débat… avec un dialogue à écouter et un jeu de rôle.'],
    ['Liberté de parcours', 'Toutes les unités sont ouvertes. Un test d’une minute permet de valider ce que vous savez déjà.'],
    ['Répétition espacée transparente', 'Vous voyez ce qui est à réviser et ce qui arrive dans la semaine.'],
    ['Vos données vous appartiennent', 'Sans compte, utilisable hors ligne, progression exportable.'],
  ];
  app.innerHTML = `
    ${baoSays('proud', 'Polyglotte part des critiques les plus fréquentes faites à Duolingo et y répond une par une.', { size: 110 })}
    <h1>Pourquoi Polyglotte ?</h1>
    <section class="card"><ul class="why">${points.map(([t, d]) => `<li><strong>${esc(t)}</strong><span class="muted">${esc(d)}</span></li>`).join('')}</ul></section>
    <a class="btn primary" href="#/">Commencer</a>`;
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
router();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

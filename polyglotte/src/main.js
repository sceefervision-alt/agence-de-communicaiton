import { COURSES } from './data/index.js';
import * as store from './storage.js';
import { review, newCard, markKnown } from './srs.js';
import { checkAnswer, gradeFor } from './answer.js';
import { buildSession, buildTestOut, buildRoleplay, requeue, allItems, acceptedAnswers, TEST_OUT_THRESHOLD } from './session.js';
import { weeklyStatus, courseStats, unitProgress, logActivity } from './progress.js';
import { speak, canSpeak, canRecognize, recognize } from './speech.js';

let state = store.load();
const app = document.getElementById('app');

// ---------- Utilitaires ----------

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const $ = (sel, root = app) => root.querySelector(sel);
const $$ = (sel, root = app) => [...root.querySelectorAll(sel)];

const course = () => COURSES[state.settings.course] ?? COURSES.es;
const cards = () => (state.cards[course().id] ??= {});
const custom = () => (state.custom[course().id] ??= []);
const extraAlts = () => (state.extraAlts[course().id] ??= {});
const items = () => allItems(course(), custom(), extraAlts());
const persist = () => store.save(state);
const caps = () => ({ audio: state.settings.audio && canSpeak(), speech: state.settings.speaking && canRecognize() });
const say = (text, rate) => state.settings.audio && speak(text, course().speechLang, rate ? { rate } : undefined);
const langName = () => course().name.toLowerCase();
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}

function audioBtn(text, label = 'Écouter') {
  if (!caps().audio) return '';
  return `<button class="btn ghost audio-btn" data-say="${esc(text)}" aria-label="${esc(label)}" title="${esc(label)}">🔊</button>`;
}

function bindAudio(root = app) {
  $$('[data-say]', root).forEach((b) => b.addEventListener('click', () => say(b.dataset.say)));
}

function weekWidget() {
  const w = weeklyStatus(state.log, state.settings.weeklyGoal, Date.now());
  const left = Math.max(0, w.goal - w.active);
  return `
    <div class="row spread"><h2>Objectif de la semaine</h2><span class="badge ${w.reached ? 'ok' : ''}">${w.active} / ${w.goal} jours</span></div>
    <div class="week" aria-label="Jours actifs cette semaine">
      ${w.days.map((d) => `<span class="day ${d.active ? 'active' : ''} ${d.today ? 'today' : ''} ${d.future ? 'future' : ''}" title="${d.key}">${d.label}</span>`).join('')}
    </div>
    <p class="muted small">${
      w.reached
        ? 'Objectif atteint. Le reste de la semaine, c’est du bonus — ou du repos bien mérité.'
        : `Encore ${plural(left, 'jour', 'jours')} cette semaine. Les jours de repos ne vous font rien perdre.`
    }</p>`;
}

// ---------- Routeur ----------

const routes = [
  [/^#\/?$/, renderHome],
  [/^#\/parcours$/, renderPath],
  [/^#\/unite\/([\w-]+)$/, renderUnit],
  [/^#\/session\/(apprendre|reviser|role|test)(?:\/([\w-]+))?$/, startSession],
  [/^#\/vocabulaire$/, renderVocab],
  [/^#\/reglages$/, renderSettings],
  [/^#\/pourquoi$/, renderWhy],
];

function router() {
  const hash = location.hash || '#/';
  if (S && !hash.startsWith('#/session')) endSession();
  document.body.classList.remove('in-session');
  for (const [re, fn] of routes) {
    const m = hash.match(re);
    if (m) {
      const section = hash.split('/')[1] || 'home';
      $$('[data-nav]', document).forEach((a) => {
        const active = a.dataset.nav === section || (section === 'unite' && a.dataset.nav === 'parcours');
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

function renderHome() {
  const c = course();
  const stats = courseStats(items(), cards(), Date.now());
  const progress = c.units.map((u) => ({ u, p: unitProgress(u, cards()) }));
  const nextUnit = progress.find(({ u }) => u.items.some((it) => (cards()[it.id]?.stage ?? 0) === 0))?.u;
  const canDo = progress.filter(({ p }) => p.canDo).length;
  const maxF = Math.max(1, ...stats.forecast);
  const dayNames = ['Auj.', 'Dem.', ...Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 2);
    return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  })];

  app.innerHTML = `
    <section class="card">
      <div class="row spread">
        <h1>${c.flag} ${esc(c.name)}</h1>
        <div class="lang-switch" role="group" aria-label="Langue apprise">
          ${Object.values(COURSES).map((k) => `<button class="btn" data-course="${k.id}" aria-pressed="${k.id === c.id}">${k.flag} ${esc(k.name)}</button>`).join('')}
        </div>
      </div>
      <p class="muted">Apprendre en produisant, réviser au bon moment, comprendre ses erreurs. Sans vies, sans pression.</p>
      <div class="stack">
        ${stats.due > 0 ? `<a class="btn primary block" href="#/session/reviser">Réviser maintenant — ${plural(stats.due, 'élément', 'éléments')} à revoir</a>` : ''}
        ${nextUnit ? `<a class="btn ${stats.due > 0 ? '' : 'primary'} block" href="#/session/apprendre/${nextUnit.id}">${stats.seen ? 'Continuer' : 'Commencer'} : ${esc(nextUnit.title)}</a>` : ''}
        ${!nextUnit && stats.due === 0 ? '<a class="btn primary block" href="#/session/reviser">Tout est à jour — entraînement libre sur vos points faibles</a>' : ''}
      </div>
    </section>

    <section class="card">${weekWidget()}</section>

    <section class="grid">
      <div class="card stat"><div class="num">${stats.mastered}</div><div class="label">éléments maîtrisés<br><span class="small">(révision espacée ≥ 3 semaines)</span></div></div>
      <div class="card stat"><div class="num">${stats.learning}</div><div class="label">en cours d’apprentissage</div></div>
      <div class="card stat"><div class="num">${stats.due}</div><div class="label">à réviser aujourd’hui</div></div>
      <div class="card stat"><div class="num">${canDo} / ${c.units.length}</div><div class="label">compétences « Je peux… » validées</div></div>
    </section>

    <section class="card">
      <h2>Révisions à venir</h2>
      <p class="muted small">La répétition espacée vous montre ce qui arrive : pas de surprise, pas de pile cachée.</p>
      <div class="forecast" aria-label="Prévision des révisions sur 7 jours">
        ${stats.forecast.map((n, i) => `<div><span style="height:${Math.round((n / maxF) * 46)}px"></span>${n}<br>${esc(dayNames[i])}</div>`).join('')}
      </div>
    </section>

    <p><a href="#/pourquoi">Pourquoi Polyglotte est différent de Duolingo →</a></p>
  `;
  $$('[data-course]').forEach((b) =>
    b.addEventListener('click', () => {
      state.settings.course = b.dataset.course;
      persist();
      renderHome();
    }),
  );
}

// ---------- Parcours ----------

function renderPath() {
  const c = course();
  const perso = custom();
  app.innerHTML = `
    <h1>Parcours ${c.flag}</h1>
    <p class="muted">Toutes les unités sont ouvertes : commencez par ce qui vous sert. Vous connaissez déjà une unité ? Validez-la en une minute.</p>
    ${c.units
      .map((u, i) => {
        const p = unitProgress(u, cards());
        return `
        <a class="card unit" href="#/unite/${u.id}">
          <div class="row spread"><h2>${i + 1}. ${esc(u.title)}</h2>${p.canDo ? '<span class="badge ok">✓ Validée</span>' : `<span class="badge">${p.known} / ${p.total}</span>`}</div>
          <p>${esc(u.canDo)}</p>
          <div class="bar" aria-hidden="true"><span style="width:${Math.round(p.ratio * 100)}%"></span></div>
        </a>`;
      })
      .join('')}
    <a class="card unit" href="#/vocabulaire">
      <div class="row spread"><h2>★ Mon vocabulaire</h2><span class="badge">${perso.length} mot${perso.length > 1 ? 's' : ''}</span></div>
      <p>Vos propres mots, intégrés à la répétition espacée.</p>
    </a>
  `;
}

// ---------- Unité ----------

function renderUnit(unitId) {
  const u = course().units.find((x) => x.id === unitId);
  if (!u) return (location.hash = '#/parcours');
  const p = unitProgress(u, cards());
  const fresh = u.items.filter((it) => (cards()[it.id]?.stage ?? 0) === 0).length;
  const levelLabel = (stage) => ['Nouveau', 'Découvert', 'Reconnu', 'Rappel', 'Production', 'Production'][stage] ?? 'Nouveau';

  app.innerHTML = `
    <p><a href="#/parcours">← Parcours</a></p>
    <h1>${esc(u.title)}</h1>
    <p class="row"><span class="badge ${p.canDo ? 'ok' : ''}">${p.canDo ? '✓' : '○'} ${esc(u.canDo)}</span></p>
    <div class="stack" style="margin-bottom:16px">
      <a class="btn primary block" href="#/session/apprendre/${u.id}">${fresh ? `Apprendre (${plural(fresh, 'nouvel élément', 'nouveaux éléments')})` : 'Retravailler cette unité'}</a>
      <div class="row">
        <a class="btn" href="#/session/role/${u.id}">🎭 Jeu de rôle</a>
        ${p.canDo ? '' : `<a class="btn" href="#/session/test/${u.id}">⚡ Je connais déjà</a>`}
      </div>
    </div>

    <section class="card grammar">
      <h2>Comprendre : ${esc(u.grammar.title)}</h2>
      <ul>${u.grammar.body.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    </section>

    <section class="card">
      <div class="row spread"><h2>En situation</h2><button class="btn ghost" id="toggle-tr">Masquer la traduction</button></div>
      <ul class="dialogue">
        ${u.dialogue
          .map((l) => `<li class="${l.who}"><div class="bubble">${esc(l.target)} ${audioBtn(l.target)}<span class="tr">${esc(l.fr)}</span></div></li>`)
          .join('')}
      </ul>
      ${caps().audio ? '<button class="btn" id="play-all">▶ Écouter tout le dialogue</button>' : ''}
    </section>

    <section class="card">
      <h2>Phrases de l’unité</h2>
      <ul class="item-list">
        ${u.items
          .map((it) => {
            const st = cards()[it.id]?.stage ?? 0;
            return `<li><span><strong>${esc(it.target)}</strong> ${audioBtn(it.target)}<br><span class="muted small">${esc(it.fr)}</span></span><span class="badge ${st >= 3 ? 'ok' : ''}">${levelLabel(st)}</span></li>`;
          })
          .join('')}
      </ul>
    </section>
  `;
  bindAudio();
  $('#toggle-tr').addEventListener('click', (e) => {
    const hidden = $$('.tr').some((el) => el.hidden);
    $$('.tr').forEach((el) => (el.hidden = !hidden));
    e.currentTarget.textContent = hidden ? 'Masquer la traduction' : 'Afficher la traduction';
  });
  $('#play-all')?.addEventListener('click', () => {
    if (!canSpeak()) return;
    window.speechSynthesis.cancel();
    for (const l of u.dialogue) {
      const utt = new SpeechSynthesisUtterance(l.target);
      utt.lang = course().speechLang;
      utt.rate = 0.95;
      window.speechSynthesis.speak(utt);
    }
  });
}

// ---------- Session ----------

let S = null;

function startSession(mode, unitId) {
  endSession();
  const c = course();
  let queue = [];
  if (mode === 'apprendre' || mode === 'reviser') {
    queue = buildSession({
      course: c,
      cards: cards(),
      custom: custom(),
      extraAlts: extraAlts(),
      unitId: mode === 'apprendre' ? unitId : null,
      settings: state.settings,
      caps: caps(),
    });
  } else if (mode === 'role') queue = buildRoleplay(c, unitId);
  else if (mode === 'test') queue = buildTestOut(c, unitId);

  if (!queue.length) {
    app.innerHTML = `<section class="card"><h1>Rien à faire ici pour l’instant</h1>
      <p class="muted">${mode === 'reviser' ? 'Commencez une unité pour avoir des éléments à réviser.' : 'Cette unité est vide.'}</p>
      <a class="btn primary" href="#/parcours">Voir le parcours</a></section>`;
    return;
  }

  S = { mode, unitId, queue, index: 0, answers: 0, correct: 0, graded: new Set(), prev: {}, mistakes: new Map(), learned: new Set(), testCorrect: 0, phase: 'question', logged: false };
  document.body.classList.add('in-session');
  renderExercise();
}

function endSession() {
  if (S && !S.logged && S.answers > 0) {
    state.log = logActivity(state.log, { answers: S.answers, correct: S.correct });
    persist();
  }
  S = null;
}

function sessionHeader() {
  const pct = Math.round((S.index / S.queue.length) * 100);
  return `<div class="session-head">
    <a class="btn ghost" href="#/" aria-label="Quitter la session">✕</a>
    <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
  </div>`;
}

function charsBar() {
  const chars = course().specialChars;
  if (!chars.length) return '';
  return `<div class="chars" aria-label="Caractères spéciaux">${chars.map((ch) => `<button type="button" class="btn" data-char="${esc(ch)}">${esc(ch)}</button>`).join('')}</div>`;
}

function bindInput(onSubmit) {
  const input = $('#answer');
  $$('[data-char]').forEach((b) => {
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => {
      const { selectionStart: s, selectionEnd: e, value } = input;
      input.value = value.slice(0, s) + b.dataset.char + value.slice(e);
      input.setSelectionRange(s + 1, s + 1);
      input.focus();
    });
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (S?.phase === 'question') onSubmit(input.value);
    }
  });
  $('#check').addEventListener('click', () => onSubmit(input.value));
  $('#skip')?.addEventListener('click', () => onSubmit(''));
  input.focus();
}

function renderExercise() {
  const ex = S.queue[S.index];
  if (!ex) return renderSummary();
  S.phase = 'question';
  const it = ex.item;
  const lang = langName();
  let body = '';

  switch (ex.kind) {
    case 'intro':
      body = `<p class="prompt-label">Nouveau</p>
        <div class="row"><p class="target-big">${esc(it.target)}</p>${audioBtn(it.target)}</div>
        <p class="prompt">${esc(it.fr)}</p>
        ${it.note ? `<div class="card grammar small">💡 ${esc(it.note)}</div>` : ''}
        <button class="btn primary block" id="next">J’ai compris</button>`;
      break;
    case 'choice-target':
      body = `<p class="prompt-label">Comment dit-on en ${esc(lang)} ?</p><p class="prompt">${esc(it.fr)}</p>${optionsHtml(ex)}`;
      break;
    case 'choice-native':
      body = `<p class="prompt-label">Que signifie…</p><div class="row"><p class="prompt">${esc(it.target)}</p>${audioBtn(it.target)}</div>${optionsHtml(ex)}`;
      break;
    case 'listen-choice':
      body = `<p class="prompt-label">Écoutez et choisissez le sens</p>
        <div class="row" style="margin:12px 0 20px"><button class="btn audio-big" data-say="${esc(it.target)}" aria-label="Écouter">🔊</button><button class="btn" id="slow">🐢 Plus lent</button></div>
        ${optionsHtml(ex)}`;
      break;
    case 'write':
    case 'roleplay':
      body = `${ex.kind === 'roleplay' ? contextHtml(ex) : ''}
        <p class="prompt-label">${ex.kind === 'roleplay' ? 'Votre réplique' : `Écrivez en ${esc(lang)}`}${ex.testOut ? ' — test de niveau' : ''}</p>
        <p class="prompt">${esc(it.fr)}</p>
        ${answerInput()}`;
      break;
    case 'dictation':
      body = `<p class="prompt-label">Écrivez ce que vous entendez</p>
        <div class="row" style="margin:12px 0 20px"><button class="btn audio-big" data-say="${esc(it.target)}" aria-label="Écouter">🔊</button><button class="btn" id="slow">🐢 Plus lent</button></div>
        ${answerInput()}`;
      break;
    case 'speak':
      body = `<p class="prompt-label">Dites à voix haute</p>
        <div class="row"><p class="target-big">${esc(it.target)}</p>${audioBtn(it.target)}</div>
        <p class="muted">${esc(it.fr)}</p>
        <div class="stack"><button class="btn primary block" id="mic">🎤 Appuyez puis parlez</button>
        <button class="btn ghost block" id="no-mic">Je ne peux pas parler maintenant</button></div>`;
      break;
  }

  app.innerHTML = `${sessionHeader()}<section>${body}<div id="feedback" aria-live="polite"></div></section>`;
  bindAudio();

  if (ex.kind === 'intro') {
    say(it.target);
    $('#next').focus();
    $('#next').addEventListener('click', () => {
      const card = cards()[it.id];
      if (!card || card.stage === 0) {
        cards()[it.id] = { ...newCard(), stage: 1, due: Date.now() };
        persist();
      }
      S.learned.add(it.id);
      next();
    });
  } else if (ex.options) {
    if (ex.kind === 'listen-choice') say(it.target);
    $('#slow')?.addEventListener('click', () => say(it.target, 0.6));
    $$('.option').forEach((b) => b.addEventListener('click', () => answerChoice(ex, b.dataset.value)));
  } else if (ex.kind === 'speak') {
    $('#mic').addEventListener('click', () => answerSpeak(ex));
    $('#no-mic').addEventListener('click', () => {
      // Pas de pénalité : on bascule simplement sur l'écrit.
      S.queue[S.index] = { ...ex, kind: 'write' };
      renderExercise();
    });
  } else {
    if (ex.kind === 'dictation') {
      say(it.target);
      $('#slow').addEventListener('click', () => say(it.target, 0.6));
    }
    bindInput((value) => answerText(ex, value));
  }
}

function optionsHtml(ex) {
  return `<div class="options ${ex.options.some((o) => o.length > 28) ? '' : 'two'}">
    ${ex.options.map((o, i) => `<button class="option" data-value="${esc(o)}"><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join('')}
  </div>`;
}

function answerInput() {
  return `<input id="answer" class="answer-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(course().speechLang)}" aria-label="Votre réponse" />
    ${charsBar()}
    <div class="row" style="margin-top:12px"><button class="btn primary" id="check">Vérifier</button><button class="btn ghost" id="skip">Je ne sais pas</button></div>`;
}

function contextHtml(ex) {
  if (!ex.context.length) return '<p class="muted small">C’est à vous de commencer la conversation.</p>';
  return `<ul class="dialogue context">${ex.context
    .map((l) => `<li class="${l.who}"><div class="bubble">${esc(l.target)} ${l.who === 'them' ? audioBtn(l.target) : ''}<span class="tr">${esc(l.fr)}</span></div></li>`)
    .join('')}</ul>`;
}

function accepted(ex) {
  return [...new Set([...acceptedAnswers(ex.item), ...(extraAlts()[ex.itemId] ?? [])])];
}

// Met à jour la répétition espacée : seule la première tentative de la session compte.
function applyGrade(ex, status) {
  if (!['apprendre', 'reviser'].includes(S.mode) || ex.retry || S.graded.has(ex.itemId)) return;
  S.graded.add(ex.itemId);
  const prev = cards()[ex.itemId] ?? newCard();
  S.prev[ex.itemId] = prev;
  cards()[ex.itemId] = review({ ...prev, stage: Math.max(prev.stage, 1) }, gradeFor(status));
  persist();
}

function record(ex, status) {
  S.answers += 1;
  if (status !== 'wrong') {
    S.correct += 1;
    if (ex.testOut) S.testCorrect += 1;
  } else {
    S.mistakes.set(ex.itemId, ex.item);
  }
  applyGrade(ex, status);
  if (status === 'wrong' && (S.mode === 'apprendre' || S.mode === 'reviser')) {
    S.queue = requeue(S.queue, S.index, ex);
  }
}

function answerChoice(ex, value) {
  if (S.phase !== 'question') return;
  const ok = value === ex.answer;
  $$('.option').forEach((b) => {
    b.disabled = true;
    if (b.dataset.value === ex.answer) b.classList.add('correct');
    else if (b.dataset.value === value) b.classList.add('wrong');
  });
  const status = ok ? 'correct' : 'wrong';
  record(ex, status);
  showFeedback(ex, {
    status,
    message: ok ? 'Bien vu !' : `La bonne réponse était : « ${ex.answer} ».`,
    showTarget: true,
  });
}

function answerText(ex, value) {
  if (S.phase !== 'question') return;
  const result = checkAnswer(value, accepted(ex), { lang: course().id, strictAccents: state.settings.strictAccents });
  $('#answer').disabled = true;
  $$('#check, #skip, [data-char]').forEach((b) => (b.disabled = true));
  record(ex, result.status);
  showFeedback(ex, { ...result, given: value, showTarget: result.status !== 'correct' || result.expected !== result.canonical });
}

async function answerSpeak(ex) {
  if (S.phase !== 'question') return;
  const mic = $('#mic');
  mic.disabled = true;
  mic.textContent = '🎙️ Je vous écoute…';
  try {
    const heard = await recognize(course().speechLang);
    let best = null;
    for (const h of heard) {
      const r = checkAnswer(h, accepted(ex), { lang: course().id });
      if (!best || (best.status === 'wrong' && r.status !== 'wrong')) best = { ...r, heard: h };
    }
    if (best.status === 'wrong') {
      // La reconnaissance vocale se trompe aussi : pas de pénalité, on propose de réessayer.
      showFeedback(ex, { status: 'wrong', message: `J’ai entendu : « ${best.heard} ». Réessayez, ou continuez sans pénalité.`, showTarget: true, retrySpeak: true });
      return;
    }
    record(ex, best.status);
    showFeedback(ex, { ...best, message: `J’ai entendu : « ${best.heard} ». ${best.status === 'correct' ? 'Excellente prononciation !' : 'Presque, c’est compris.'}`, showTarget: false });
  } catch (err) {
    mic.disabled = false;
    mic.textContent = '🎤 Appuyez puis parlez';
    toast(err.message);
  }
}

function diffHtml(diff) {
  if (!diff) return '';
  return `<p class="diff small">${diff
    .map((op) => (op.type === 'same' ? esc(op.word) : op.type === 'missing' ? `<mark class="missing">${esc(op.word)}</mark>` : `<s class="extra">${esc(op.word)}</s>`))
    .join(' ')}</p><p class="muted small">Surligné : ce qui manquait · barré : ce qui était en trop.</p>`;
}

function showFeedback(ex, r) {
  S.phase = 'feedback';
  const it = ex.item;
  const titles = { correct: 'Correct', almost: 'Presque !', wrong: 'Pas tout à fait' };
  const canContest = r.status === 'wrong' && r.given && r.given.trim() && !ex.options;
  const fb = $('#feedback');
  fb.className = `feedback ${r.status}`;
  fb.innerHTML = `
    <h3>${titles[r.status]}</h3>
    <p>${esc(r.message)}</p>
    ${r.showTarget || r.status !== 'correct' ? `<p><strong>${esc(r.expected ?? it.target)}</strong> ${audioBtn(r.expected ?? it.target)}<br><span class="small">${esc(it.fr)}</span></p>` : ''}
    ${r.status === 'wrong' ? diffHtml(r.diff) : ''}
    ${it.note && r.status !== 'correct' ? `<p class="note small">💡 ${esc(it.note)}</p>` : ''}
    ${r.status === 'wrong' && S.mode !== 'test' && S.mode !== 'role' && !r.retrySpeak ? '<p class="small muted">Pas de souci : cet élément reviendra un peu plus loin.</p>' : ''}
    <div class="row" style="margin-top:12px">
      ${r.retrySpeak ? '<button class="btn" id="retry-speak">🎤 Réessayer</button>' : ''}
      <button class="btn primary" id="continue">Continuer</button>
      ${canContest ? '<button class="btn ghost" id="contest">Ma réponse était correcte</button>' : ''}
    </div>`;
  bindAudio(fb);
  if (r.status !== 'correct' || ex.kind === 'dictation' || ex.kind === 'roleplay') say(r.expected ?? it.target);
  $('#continue').addEventListener('click', next);
  $('#continue').focus();
  $('#retry-speak')?.addEventListener('click', () => renderExercise());
  $('#contest')?.addEventListener('click', () => contest(ex, r.given));
}

// Duolingo ne permet pas de contester une correction ; ici, l'apprenant peut
// ajouter sa réponse aux réponses acceptées (elle sera reconnue ensuite).
function contest(ex, given) {
  const alts = (extraAlts()[ex.itemId] ??= []);
  if (!alts.includes(given.trim())) alts.push(given.trim());
  if (S.prev[ex.itemId]) cards()[ex.itemId] = review(S.prev[ex.itemId], 'hard');
  const retryIdx = S.queue.findIndex((e, i) => i > S.index && e.retry && e.itemId === ex.itemId);
  if (retryIdx > -1) S.queue.splice(retryIdx, 1);
  S.mistakes.delete(ex.itemId);
  S.correct += 1;
  if (ex.testOut) S.testCorrect += 1;
  persist();
  toast('Votre réponse est désormais acceptée.');
  next();
}

function next() {
  if (!S) return;
  S.index += 1;
  renderExercise();
}

function renderSummary() {
  const s = S;
  const rate = s.answers ? Math.round((s.correct / s.answers) * 100) : 100;
  let extra = '';

  if (s.mode === 'test') {
    const u = course().units.find((x) => x.id === s.unitId);
    const total = s.queue.length;
    const passed = s.testCorrect / total >= TEST_OUT_THRESHOLD;
    if (passed) {
      for (const it of u.items) cards()[it.id] = markKnown(cards()[it.id] ?? newCard());
      persist();
    }
    extra = passed
      ? `<div class="feedback correct"><h3>Unité validée</h3><p>${s.testCorrect} / ${total} : les ${u.items.length} éléments sont marqués comme connus. Ils reviendront en révision dans 3 jours pour vérifier qu’ils sont bien ancrés.</p></div>`
      : `<div class="feedback almost"><h3>Pas encore</h3><p>${s.testCorrect} / ${total}. Faites l’unité normalement : avec vos bases, ça ira vite.</p></div>`;
  }

  if (s.mode === 'role') {
    const u = course().units.find((x) => x.id === s.unitId);
    extra = `<section class="card"><h2>Le dialogue complet</h2><ul class="dialogue">${u.dialogue
      .map((l) => `<li class="${l.who}"><div class="bubble">${esc(l.target)} ${audioBtn(l.target)}<span class="tr">${esc(l.fr)}</span></div></li>`)
      .join('')}</ul></section>`;
  }

  const mistakes = [...s.mistakes.values()];
  const unitLeft = s.mode === 'apprendre' && course().units.find((u) => u.id === s.unitId)?.items.some((it) => (cards()[it.id]?.stage ?? 0) === 0);

  if (s.answers > 0) {
    state.log = logActivity(state.log, { answers: s.answers, correct: s.correct });
    s.logged = true;
    persist();
  }

  app.innerHTML = `
    <section class="card">
      <h1>Session terminée</h1>
      <div class="grid">
        <div class="stat"><div class="num">${s.answers}</div><div class="label">réponses</div></div>
        <div class="stat"><div class="num">${rate} %</div><div class="label">de réussite</div></div>
        ${s.learned.size ? `<div class="stat"><div class="num">${s.learned.size}</div><div class="label">nouveaux éléments</div></div>` : ''}
      </div>
    </section>
    ${extra}
    ${
      mistakes.length
        ? `<section class="card"><h2>À retravailler</h2><p class="muted small">Ces éléments reviendront plus tôt en révision. Les erreurs servent à ça.</p>
          <ul class="item-list">${mistakes.map((it) => `<li><span><strong>${esc(it.target)}</strong> ${audioBtn(it.target)}<br><span class="muted small">${esc(it.fr)}</span></span></li>`).join('')}</ul></section>`
        : ''
    }
    <section class="card">${weekWidget()}</section>
    <div class="stack">
      ${unitLeft ? `<a class="btn primary block" href="#/session/apprendre/${s.unitId}">Continuer l’unité</a>` : ''}
      <a class="btn ${unitLeft ? '' : 'primary'} block" href="#/">Retour à l’accueil</a>
    </div>`;
  bindAudio();
  S = null;
  document.body.classList.remove('in-session');
}

document.addEventListener('keydown', (e) => {
  if (!S) return;
  if (S.phase === 'feedback' && e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
    e.preventDefault();
    next();
  } else if (S.phase === 'question' && /^[1-4]$/.test(e.key) && e.target.tagName !== 'INPUT') {
    $$('.option')[Number(e.key) - 1]?.click();
  }
});

// ---------- Vocabulaire personnel ----------

function renderVocab() {
  const list = custom();
  app.innerHTML = `
    <h1>Mon vocabulaire ${course().flag}</h1>
    <p class="muted">Ajoutez les mots dont <em>vous</em> avez besoin (travail, voyage, loisirs). Ils suivent la même répétition espacée que le reste du cours.</p>
    <form class="card" id="vocab-form">
      <label class="field"><span>En français</span><input type="text" name="fr" required maxlength="120" placeholder="ex. un rendez-vous" /></label>
      <label class="field"><span>En ${esc(langName())}</span><input type="text" name="target" required maxlength="120" lang="${esc(course().speechLang)}" placeholder="${course().id === 'es' ? 'ex. una cita' : 'ex. an appointment'}" /></label>
      <label class="field"><span>Autres réponses acceptées <span class="muted small">(facultatif, séparées par ;)</span></span><input type="text" name="alts" maxlength="240" /></label>
      <button class="btn primary" type="submit">Ajouter</button>
    </form>
    ${
      list.length
        ? `<section class="card">
            <div class="row spread"><h2>${plural(list.length, 'mot', 'mots')}</h2><a class="btn primary" href="#/session/apprendre/perso">Apprendre mes mots</a></div>
            <ul class="item-list">${list
              .map((it) => `<li><span><strong>${esc(it.target)}</strong> ${audioBtn(it.target)}<br><span class="muted small">${esc(it.fr)}</span></span><button class="btn ghost" data-del="${esc(it.id)}" aria-label="Supprimer ${esc(it.target)}">Supprimer</button></li>`)
              .join('')}</ul>
          </section>`
        : '<p class="muted">Aucun mot pour l’instant.</p>'
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
      <label class="field"><span>Langue apprise</span>
        <select name="course">${Object.values(COURSES).map((c) => `<option value="${c.id}" ${c.id === s.course ? 'selected' : ''}>${c.flag} ${esc(c.name)}</option>`).join('')}</select>
      </label>
      <label class="field"><span>Nouveaux éléments par session</span>
        <input type="number" name="newPerSession" min="1" max="10" value="${s.newPerSession}" />
      </label>
      <label class="field"><span>Objectif : jours d’entraînement par semaine</span>
        <input type="number" name="weeklyGoal" min="1" max="7" value="${s.weeklyGoal}" />
      </label>
      <label class="check"><input type="checkbox" name="audio" ${s.audio ? 'checked' : ''} ${canSpeak() ? '' : 'disabled'} />
        <span>Audio (écoute et dictée)${canSpeak() ? '' : ' — non disponible dans ce navigateur'}</span></label>
      <label class="check"><input type="checkbox" name="speaking" ${s.speaking ? 'checked' : ''} ${canRecognize() ? '' : 'disabled'} />
        <span>Exercices d’expression orale${canRecognize() ? '' : ' — non disponible dans ce navigateur (essayez Chrome ou Edge)'}</span></label>
      <label class="check"><input type="checkbox" name="strictAccents" ${s.strictAccents ? 'checked' : ''} />
        <span>Mode strict : un accent manquant compte comme une erreur</span></label>
    </form>

    <section class="card">
      <h2>Vos données</h2>
      <p class="muted small">Pas de compte, pas de serveur : votre progression reste sur cet appareil. Exportez-la pour la sauvegarder ou la transférer.</p>
      <div class="row">
        <button class="btn" id="export">⬇ Exporter</button>
        <label class="btn">⬆ Importer<input type="file" id="import" accept="application/json" hidden /></label>
        <button class="btn ghost" id="reset">Réinitialiser ${esc(course().name.toLowerCase())}</button>
      </div>
    </section>`;

  $('#settings').addEventListener('change', (e) => {
    const el = e.target;
    if (el.type === 'checkbox') s[el.name] = el.checked;
    else if (el.type === 'number') s[el.name] = Math.min(Number(el.max), Math.max(Number(el.min), Number(el.value) || 1));
    else s[el.name] = el.value;
    persist();
    toast('Réglage enregistré.');
    if (el.name === 'course') renderSettings();
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
      state = store.importJSON(await file.text());
      persist();
      toast('Progression importée.');
      renderSettings();
    } catch (err) {
      toast(err.message);
    }
  });
  $('#reset').addEventListener('click', () => {
    if (!confirm(`Effacer toute votre progression en ${langName()} ? Cette action est irréversible.`)) return;
    state.cards[course().id] = {};
    persist();
    toast('Progression réinitialisée.');
  });
}

// ---------- Pourquoi ----------

function renderWhy() {
  const points = [
    ['Pas de vies, pas de cœurs', 'Une erreur ne vous bloque jamais : l’élément revient simplement plus loin dans la session.'],
    ['Un objectif hebdomadaire, pas une série quotidienne', 'Vous choisissez combien de jours par semaine. Les jours de repos ne vous font rien perdre, et aucune notification ne vous culpabilise.'],
    ['Produire, pas seulement reconnaître', 'Chaque élément progresse : découverte → choix → écoute → rappel écrit → dictée et oral.'],
    ['Des corrections qui expliquent', 'Accent, faute de frappe, article, ordre des mots, mot manquant : on vous dit précisément quoi. Et si votre réponse était juste, vous pouvez la faire accepter.'],
    ['La grammaire expliquée', 'Chaque unité a sa fiche « Comprendre », et chaque erreur affiche la règle concernée.'],
    ['Des situations réelles', 'Café, ville, marché… avec un dialogue à écouter et un jeu de rôle où vous tapez vos répliques.'],
    ['Liberté de parcours', 'Toutes les unités sont ouvertes. Un test d’une minute permet de valider ce que vous savez déjà.'],
    ['Répétition espacée transparente', 'Vous voyez combien d’éléments sont à réviser et ce qui arrive dans la semaine.'],
    ['Votre vocabulaire', 'Ajoutez vos propres mots : ils entrent dans la même répétition espacée.'],
    ['Vos données vous appartiennent', 'Sans compte, utilisable hors ligne, progression exportable.'],
  ];
  app.innerHTML = `
    <h1>Pourquoi Polyglotte ?</h1>
    <p class="muted">Polyglotte part des critiques les plus fréquentes faites à Duolingo et y répond une par une.</p>
    <section class="card"><ul class="why">${points.map(([t, d]) => `<li><strong>${esc(t)}</strong><span class="muted">${esc(d)}</span></li>`).join('')}</ul></section>
    <a class="btn primary" href="#/">Commencer</a>`;
}

// ---------- Démarrage ----------

window.addEventListener('hashchange', router);
router();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

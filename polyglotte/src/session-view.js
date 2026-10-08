// Déroulé d'une session d'exercices. Bao réagit à chaque réponse :
// il réfléchit avec l'apprenant, applaudit, ou console sans jamais punir.

import { review, newCard, markKnown } from './srs.js';
import { checkAnswer, gradeFor } from './answer.js';
import { buildSession, buildTestOut, buildRoleplay, requeue, acceptedAnswers, TEST_OUT_THRESHOLD } from './session.js';
import { recognize } from './speech.js';
import { reveal } from './reveal.js';
import { confetti } from './confetti.js';
import {
  state, app, persist, esc, $, $$, toast, icon, course, cards, custom, extraAlts, langName, caps, say, bao,
  audioBtn, bindAudio, targetText, weekWidget, snapshot, finishActivity, rewardsHtml, updateBambooCounter,
} from './app-state.js';

let S = null;

export const sessionActive = () => !!S;

export function startSession(mode, unitId) {
  endSession();
  const c = course();
  let queue = [];
  if (mode === 'apprendre' || mode === 'reviser') {
    queue = buildSession({ course: c, cards: cards(), custom: custom(), extraAlts: extraAlts(), unitId: mode === 'apprendre' ? unitId : null, settings: state.settings, caps: caps() });
  } else if (mode === 'role') queue = buildRoleplay(c, unitId);
  else if (mode === 'test') queue = buildTestOut(c, unitId);

  if (!queue.length) {
    app.innerHTML = `<section class="card center">${bao('sleep', 140)}<h1>Rien à faire ici pour l’instant</h1>
      <p class="muted">${mode === 'reviser' ? 'Commencez une unité : Bao vous préparera ensuite vos révisions.' : 'Cette leçon n’est pas encore prête.'}</p>
      <a class="btn primary" href="#/parcours">Voir le parcours</a></section>`;
    return;
  }
  S = {
    mode, unitId, queue, index: 0, answers: 0, correct: 0, wrong: 0, written: 0,
    graded: new Set(), prev: {}, mistakes: new Map(), learned: new Set(), testCorrect: 0,
    phase: 'question', before: snapshot(), done: false,
  };
  document.body.classList.add('in-session');
  renderExercise();
}

// Quitter en cours de route : l'activité compte quand même, sans culpabiliser.
export function endSession() {
  if (S && !S.done && S.answers > 0) {
    finishActivity({ before: S.before, summary: summaryOf(S) });
    updateBambooCounter();
  }
  S = null;
}

function summaryOf(s) {
  return { mode: s.mode, answers: s.answers, correct: s.correct, wrong: s.wrong, learned: s.learned.size, written: s.written };
}

function sessionHeader(mood = 'think') {
  const pct = Math.round((S.index / S.queue.length) * 100);
  return `<div class="session-head">
    <a class="btn ghost" href="#/" aria-label="Quitter la session">${icon('close')}</a>
    <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
    <div class="mini-bao" id="mini-bao">${bao(mood, 56)}</div>
  </div>`;
}

function setMiniBao(mood) {
  const el = $('#mini-bao');
  if (el) el.innerHTML = bao(mood, 56);
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
      input.setSelectionRange(s + b.dataset.char.length, s + b.dataset.char.length);
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

function answerInput() {
  const nonLatin = course().script && !course().specialChars.length;
  return `<input id="answer" class="answer-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" dir="auto" lang="${esc(course().speechLang)}" aria-label="Votre réponse" />
    ${nonLatin ? `<p class="muted small">Écrivez en ${esc(course().script)} ou en caractères latins (romanisation) : les deux sont acceptés.</p>` : ''}
    ${charsBar()}
    <div class="row actions"><button class="btn primary" id="check">Vérifier</button><button class="btn ghost" id="skip">Je ne sais pas</button></div>`;
}

function optionsHtml(ex) {
  const isTarget = ex.kind === 'choice-target';
  return `<div class="options ${ex.options.some((o) => o.length > 28) ? '' : 'two'}">
    ${ex.options.map((o, i) => `<button class="option" data-value="${esc(o)}" ${isTarget ? `dir="auto"` : ''}><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join('')}
  </div>`;
}

function contextHtml(ex) {
  if (!ex.context.length) return '<p class="muted small">C’est à vous de commencer la conversation.</p>';
  return `<ul class="dialogue context">${ex.context
    .map((l) => `<li class="${l.who}"><div class="bubble">${targetText(l.target, l.translit)} ${l.who === 'them' ? audioBtn(l.target) : ''}<span class="tr">${esc(l.fr)}</span></div></li>`)
    .join('')}</ul>`;
}

function renderExercise() {
  const ex = S.queue[S.index];
  if (!ex) return renderSummary();
  S.phase = 'question';
  const it = ex.item;
  const lang = langName();
  let body = '';
  let mood = 'think';

  switch (ex.kind) {
    case 'intro':
      mood = 'wave';
      body = `<p class="prompt-label">Nouveau</p>
        <div class="row">${targetText(it.target, it.translit, { big: true })}${audioBtn(it.target)}</div>
        <p class="prompt">${esc(it.fr)}</p>
        ${it.note ? `<div class="card grammar small"><span class="eyebrow">Note de Bao</span>${esc(it.note)}</div>` : ''}
        <button class="btn primary block" id="next">J’ai compris</button>`;
      break;
    case 'choice-target':
      body = `<p class="prompt-label">Comment dit-on en ${esc(lang)} ?</p><p class="prompt">${esc(it.fr)}</p>${optionsHtml(ex)}`;
      break;
    case 'choice-native':
      body = `<p class="prompt-label">Que signifie…</p><div class="row prompt">${targetText(it.target, it.translit)}${audioBtn(it.target)}</div>${optionsHtml(ex)}`;
      break;
    case 'listen-choice':
      mood = 'listen';
      body = `<p class="prompt-label">Écoutez et choisissez le sens</p>
        <div class="row listen-row"><button class="btn audio-big" data-say="${esc(it.target)}" aria-label="Écouter">${icon('speaker', 32)}</button><button class="btn ghost" id="slow">Ralenti</button></div>
        ${optionsHtml(ex)}`;
      break;
    case 'write':
    case 'roleplay':
      mood = ex.kind === 'roleplay' ? 'listen' : 'think';
      body = `${ex.kind === 'roleplay' ? contextHtml(ex) : ''}
        <p class="prompt-label">${ex.kind === 'roleplay' ? 'Votre réplique' : `Écrivez en ${esc(lang)}`}${ex.testOut ? ' — test de niveau' : ''}</p>
        <p class="prompt">${esc(it.fr)}</p>
        ${answerInput()}`;
      break;
    case 'dictation':
      mood = 'listen';
      body = `<p class="prompt-label">Écrivez ce que vous entendez</p>
        <div class="row listen-row"><button class="btn audio-big" data-say="${esc(it.target)}" aria-label="Écouter">${icon('speaker', 32)}</button><button class="btn ghost" id="slow">Ralenti</button></div>
        ${answerInput()}`;
      break;
    case 'speak':
      mood = 'listen';
      body = `<p class="prompt-label">Dites à voix haute</p>
        <div class="row">${targetText(it.target, it.translit, { big: true })}${audioBtn(it.target)}</div>
        <p class="muted">${esc(it.fr)}</p>
        <div class="stack"><button class="btn primary block" id="mic">${icon('mic')} Appuyez puis parlez</button>
        <button class="btn ghost block" id="no-mic">Je ne peux pas parler maintenant</button></div>`;
      break;
  }

  app.innerHTML = `${sessionHeader(mood)}<section>${body}<div id="feedback" aria-live="polite"></div></section>`;
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
      S.queue[S.index] = { ...ex, kind: 'write' }; // pas de pénalité : on passe à l'écrit
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

function accepted(ex) {
  return [...new Set([...acceptedAnswers(ex.item), ...(extraAlts()[ex.itemId] ?? [])])];
}

// Seule la première tentative de la session met à jour la répétition espacée.
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
    if (['write', 'dictation', 'roleplay'].includes(ex.kind)) S.written += 1;
  } else {
    S.wrong += 1;
    S.mistakes.set(ex.itemId, ex.item);
  }
  applyGrade(ex, status);
  if (status === 'wrong' && (S.mode === 'apprendre' || S.mode === 'reviser')) S.queue = requeue(S.queue, S.index, ex);
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
  showFeedback(ex, { status, message: ok ? 'Bien vu !' : `La bonne réponse était : « ${ex.answer} ».`, showTarget: true });
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
  mic.textContent = 'Je vous écoute…';
  setMiniBao('listen');
  try {
    const heard = await recognize(course().speechLang);
    let best = null;
    for (const h of heard) {
      const r = checkAnswer(h, accepted(ex), { lang: course().id });
      if (!best || (best.status === 'wrong' && r.status !== 'wrong')) best = { ...r, heard: h };
    }
    if (best.status === 'wrong') {
      // La reconnaissance vocale se trompe aussi : pas de pénalité.
      showFeedback(ex, { status: 'wrong', message: `J’ai entendu : « ${best.heard} ». Réessayez, ou continuez sans pénalité.`, showTarget: true, retrySpeak: true });
      return;
    }
    record(ex, best.status);
    showFeedback(ex, { ...best, message: `J’ai entendu : « ${best.heard} ». ${best.status === 'correct' ? 'Excellente prononciation !' : 'Presque, c’est compris.'}`, showTarget: false });
  } catch (err) {
    mic.disabled = false;
    mic.innerHTML = `${icon('mic')} Appuyez puis parlez`;
    setMiniBao('comfort');
    toast(err.message);
  }
}

function diffHtml(diff) {
  if (!diff) return '';
  return `<p class="diff small" dir="auto">${diff
    .map((op) => (op.type === 'same' ? esc(op.word) : op.type === 'missing' ? `<mark class="missing">${esc(op.word)}</mark>` : `<s class="extra">${esc(op.word)}</s>`))
    .join(' ')}</p><p class="muted small">Surligné : ce qui manquait · barré : ce qui était en trop.</p>`;
}

const FEEDBACK = {
  correct: { title: ['Bravo !', 'Parfait !', 'Excellent !', 'Super !'], mood: 'cheer' },
  almost: { title: ['Presque !'], mood: 'happy' },
  wrong: { title: ['Pas tout à fait', 'On y est presque', 'Pas grave !'], mood: 'comfort' },
};

function showFeedback(ex, r) {
  S.phase = 'feedback';
  const it = ex.item;
  const f = FEEDBACK[r.status];
  const title = f.title[S.answers % f.title.length];
  const canContest = r.status === 'wrong' && r.given && r.given.trim() && !ex.options;
  setMiniBao(f.mood);
  const fb = $('#feedback');
  fb.className = `feedback ${r.status}`;
  fb.innerHTML = `
    <div class="feedback-body">
      <div class="feedback-bao">${bao(f.mood, 96, { live: true })}</div>
      <div>
        <h3>${title}</h3>
        <p>${esc(r.message)}</p>
        ${r.showTarget || r.status !== 'correct' ? `<p>${targetText(r.expected ?? it.target, it.translit)} ${audioBtn(r.expected ?? it.target)}<br><span class="small">${esc(it.fr)}</span></p>` : ''}
        ${r.status === 'wrong' ? diffHtml(r.diff) : ''}
        ${it.note && r.status !== 'correct' ? `<p class="note small"><span class="eyebrow">Note de Bao</span>${esc(it.note)}</p>` : ''}
        ${r.status === 'wrong' && S.mode !== 'test' && S.mode !== 'role' && !r.retrySpeak ? '<p class="small muted">Pas de souci : cet élément reviendra un peu plus loin.</p>' : ''}
      </div>
    </div>
    <div class="row actions">
      ${r.retrySpeak ? `<button class="btn" id="retry-speak">${icon('mic')} Réessayer</button>` : ''}
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

// L'apprenant peut faire accepter sa réponse (elle sera reconnue ensuite).
function contest(ex, given) {
  const alts = (extraAlts()[ex.itemId] ??= []);
  if (!alts.includes(given.trim())) alts.push(given.trim());
  if (S.prev[ex.itemId]) cards()[ex.itemId] = review(S.prev[ex.itemId], 'hard');
  const retryIdx = S.queue.findIndex((e, i) => i > S.index && e.retry && e.itemId === ex.itemId);
  if (retryIdx > -1) S.queue.splice(retryIdx, 1);
  S.mistakes.delete(ex.itemId);
  S.correct += 1;
  S.wrong = Math.max(0, S.wrong - 1);
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
  s.done = true;
  const rate = s.answers ? Math.round((s.correct / s.answers) * 100) : 100;
  const u = course().units.find((x) => x.id === s.unitId);
  let extra = '';

  if (s.mode === 'test') {
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
    extra = `<section class="card"><h2>Le dialogue complet</h2><ul class="dialogue">${u.dialogue
      .map((l) => `<li class="${l.who}"><div class="bubble">${targetText(l.target, l.translit)} ${audioBtn(l.target)}<span class="tr">${esc(l.fr)}</span></div></li>`)
      .join('')}</ul></section>`;
  }

  const result = finishActivity({ before: s.before, summary: summaryOf(s) });
  updateBambooCounter();
  const mistakes = [...s.mistakes.values()];
  const unitLeft = s.mode === 'apprendre' && u?.items.some((it) => (cards()[it.id]?.stage ?? 0) === 0);
  const mood = result.levelUp ? 'proud' : rate >= 80 ? 'cheer' : 'comfort';
  const [title, sub] =
    rate >= 90
      ? ['Quelle session !', 'Bao est fier de vous.']
      : rate >= 60
        ? ['Belle session !', 'Chaque erreur est une révision de plus, pas un échec.']
        : ['Vous avez tenu bon !', 'C’était difficile : Bao a noté ce qu’il faut revoir.'];

  app.innerHTML = `
    <section class="card summary-hero">
      ${bao(mood, 140)}
      <div>
        <p class="eyebrow">Session terminée</p>
        <h1>${esc(title)}</h1>
        <p class="muted">${esc(sub)}</p>
        <div class="grid compact">
          <div class="stat"><div class="num">${s.answers}</div><div class="label">réponses</div></div>
          <div class="stat"><div class="num">${rate} %</div><div class="label">de réussite</div></div>
          ${s.learned.size ? `<div class="stat"><div class="num">${s.learned.size}</div><div class="label">nouveautés</div></div>` : ''}
        </div>
      </div>
    </section>
    ${rewardsHtml(result)}
    ${extra}
    ${mistakes.length ? `<section class="card"><h2>À retravailler</h2><p class="muted small">Ces éléments reviendront plus tôt en révision. Les erreurs servent à ça.</p>
      <ul class="item-list">${mistakes.map((it) => `<li><span>${targetText(it.target, it.translit)} ${audioBtn(it.target)}<br><span class="muted small">${esc(it.fr)}</span></span></li>`).join('')}</ul></section>` : ''}
    <section class="card">${weekWidget()}</section>
    <div class="stack">
      ${unitLeft ? `<a class="btn primary block" href="#/session/apprendre/${s.unitId}">Continuer l’unité</a>` : ''}
      <a class="btn ${unitLeft ? '' : 'primary'} block" href="#/">Retour à l’accueil</a>
    </div>`;
  bindAudio();
  S = null;
  document.body.classList.remove('in-session');
  celebrate(result, rate);
}

// Grands moments : coffre de la semaine, cadeau du défi, nouveau niveau.
export function celebrate(result, rate = 100) {
  const chest = result.gains.filter((g) => g.weekly || g.chest).reduce((a, g) => a + g.amount, 0);
  const challenge = result.gains.find((g) => g.challenge);
  if (result.levelUp) {
    const lv = course().levels[Math.min(result.after.levelsDone, 5)];
    reveal({ kind: 'level', eyebrow: 'Nouveau niveau', title: 'Bao a grandi !', text: `Vous passez au niveau ${lv.cefr} · ${lv.name}. Nouvelle tenue, nouveau ciel dans le jardin !`, bao: { mood: 'proud', stage: Math.min(5, result.after.levelsDone), equipped: state.rewards.equipped } });
  }
  if (chest) reveal({ kind: 'chest', eyebrow: 'Objectif de la semaine', title: 'Le coffre de la semaine', amount: chest, text: 'Votre régularité paie. Bao est fier de vous !' });
  if (challenge) reveal({ kind: 'gift', eyebrow: 'Défi du jour réussi', title: 'Un cadeau pour vous', amount: challenge.amount, color: 0x8fb0ff });
  if (!result.levelUp && !chest && !challenge && rate >= 80) confetti({ count: 90 });
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

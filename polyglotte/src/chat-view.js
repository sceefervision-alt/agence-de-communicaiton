// Converser avec Bao, le professeur IA. L'apprenant parle (micro) ou écrit ;
// Bao répond à voix haute, corrige avec bienveillance et propose des idées
// de réponse. Son expression change selon la conversation.

import { requestTutor } from './tutor.js';
import { GeneratorUnavailable } from './generator.js';
import { recognize, stopSpeaking } from './speech.js';
import {
  state, app, persist, esc, $, $$, toast, icon, course, currentLanguage, caps, say, bao, level,
  snapshot, finishActivity, rewardsHtml, updateBambooCounter, targetText,
} from './app-state.js';

let C = null;

export function endChat() {
  if (!C) return;
  stopSpeaking();
  if (C.learnerTurns > 0 && !C.done) {
    finishActivity({ before: C.before, summary: { mode: 'chat', answers: C.learnerTurns, correct: C.learnerTurns, wrong: 0, learned: 0, written: 0 } });
    updateBambooCounter();
  }
  C = null;
}

export function renderChat(unitParam) {
  endChat();
  const lv = level();
  const levelData = course().levels[lv.current];
  const nextUnit = levelData.units.find((u) => !u.ready || u.items.some((it) => !state.cards[course().id]?.[it.id])) ?? levelData.units[0];
  C = {
    history: [],
    learnerTurns: 0,
    busy: false,
    listening: false,
    handsFree: state.settings.handsFree ?? false,
    showTr: state.settings.chatTranslations ?? true,
    levelId: levelData.id,
    unitId: unitParam === 'libre' ? '' : unitParam || nextUnit.id,
    before: snapshot(),
    done: false,
  };

  const canTalk = caps().speech;
  app.innerHTML = `
    <section class="chat">
      <div class="row spread chat-top">
        <div><p class="eyebrow">Professeur IA · ${esc(levelData.cefr)} ${esc(levelData.name)}</p><h1>Converser avec Bao</h1></div>
        <button class="btn" id="end-chat">Terminer</button>
      </div>
      <div class="row chat-options">
        <label class="field inline"><span>Situation</span>
          <select id="scenario">
            <option value="">Conversation libre</option>
            ${course()
              .levels.slice(0, lv.current + 1)
              .reverse()
              .map((l) => `<optgroup label="${esc(l.cefr)} · ${esc(l.name)}">${l.units.map((u) => `<option value="${u.id}" ${u.id === C.unitId ? 'selected' : ''}>${esc(u.title)}</option>`).join('')}</optgroup>`)
              .join('')}
          </select>
        </label>
        <label class="check inline"><input type="checkbox" id="show-tr" ${C.showTr ? 'checked' : ''}/><span>Traductions</span></label>
        ${canTalk ? `<label class="check inline"><input type="checkbox" id="hands-free" ${C.handsFree ? 'checked' : ''}/><span>Mains libres</span></label>` : ''}
      </div>

      <div class="chat-stage card">
        <div class="chat-bao" id="chat-bao">${bao('wave', 150)}</div>
        <div class="chat-current" id="chat-current" aria-live="polite"><p class="muted">Bao prépare sa première question…</p></div>
      </div>

      <ol class="chat-log ${C.showTr ? '' : 'hide-tr'}" id="chat-log" aria-label="Historique de la conversation"></ol>
      <div class="chat-suggestions" id="suggestions"></div>

      <form class="chat-input" id="chat-form">
        ${canTalk ? `<button type="button" class="btn primary mic-btn" id="mic" aria-label="Parler à Bao">${icon('mic', 22)}</button>` : ''}
        <input id="chat-text" class="answer-input" type="text" dir="auto" autocomplete="off" lang="${esc(course().speechLang)}" placeholder="${canTalk ? 'Parlez, ou écrivez ici…' : 'Écrivez votre réponse…'}" aria-label="Votre message" maxlength="500" />
        <button type="submit" class="btn" aria-label="Envoyer">${icon('send')}</button>
      </form>
      ${canTalk ? '' : `<p class="muted small center">${course().speechLang ? 'La reconnaissance vocale n’est pas disponible dans ce navigateur (essayez Chrome ou Edge) : la conversation se fait à l’écrit.' : 'La voix n’est pas disponible pour cette langue : la conversation se fait à l’écrit.'}</p>`}
    </section>`;

  $('#chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#chat-text').value.trim();
    if (text) send(text);
  });
  $('#mic')?.addEventListener('click', () => (C.listening ? null : listen()));
  $('#end-chat').addEventListener('click', finish);
  $('#show-tr').addEventListener('change', (e) => {
    C.showTr = e.target.checked;
    state.settings.chatTranslations = C.showTr;
    persist();
    $('#chat-log').classList.toggle('hide-tr', !C.showTr);
    $('#chat-current').classList.toggle('hide-tr', !C.showTr);
  });
  $('#hands-free')?.addEventListener('change', (e) => {
    C.handsFree = e.target.checked;
    state.settings.handsFree = C.handsFree;
    persist();
  });
  $('#scenario').addEventListener('change', (e) => {
    location.hash = `#/converser/${e.target.value || 'libre'}`;
  });

  ask();
}

function setBao(mood) {
  const el = $('#chat-bao');
  if (el) el.innerHTML = bao(mood, 150);
}

function renderLog() {
  const log = $('#chat-log');
  if (!log) return;
  // La dernière réplique de Bao est affichée en grand au-dessus.
  const past = C.history.slice(0, -1);
  log.innerHTML = past
    .map((m) =>
      m.role === 'assistant'
        ? `<li class="them"><div class="bubble">${targetText(m.text, m.translit)}<span class="tr">${esc(m.translation)}</span></div></li>`
        : `<li class="you"><div class="bubble"><span dir="auto">${esc(m.text)}</span></div>${
            m.correction
              ? `<div class="correction"><span class="eyebrow">Plus naturel</span><span dir="auto">${esc(m.correction.corrected)}</span><span class="small muted">${esc(m.correction.explanation)}</span></div>`
              : m.checked
                ? `<div class="correction ok">${icon('check', 14)} Parfait</div>`
                : ''
          }</li>`,
    )
    .join('');
  log.scrollTop = log.scrollHeight;
}

function renderCurrent(reply) {
  const el = $('#chat-current');
  el.classList.toggle('hide-tr', !C.showTr);
  el.innerHTML = `
    <div class="speech big">
      <div class="row">${targetText(reply.reply, reply.translit)}${caps().audio ? `<button class="btn ghost audio-btn" id="replay" aria-label="Réécouter">${icon('speaker')}</button>` : ''}</div>
      <span class="tr">${esc(reply.translation)}</span>
    </div>`;
  $('#replay')?.addEventListener('click', () => say(reply.reply));
  $('#suggestions').innerHTML = reply.suggestions.length
    ? `<span class="muted small">Idées de réponse :</span>${reply.suggestions
        .map((s, i) => `<button class="chip" data-sugg="${i}" title="${esc(s.fr)}"><span dir="auto">${esc(s.target)}</span><span class="tr">${esc(s.fr)}</span></button>`)
        .join('')}`
    : '';
  $$('[data-sugg]').forEach((b) =>
    b.addEventListener('click', () => {
      const s = reply.suggestions[Number(b.dataset.sugg)];
      $('#chat-text').value = s.target;
      $('#chat-text').focus();
    }),
  );
}

async function ask() {
  if (!C) return;
  const session = C;
  session.busy = true;
  setBao('think');
  $('#chat-current').insertAdjacentHTML('beforeend', '<p class="typing" aria-label="Bao réfléchit"><span></span><span></span><span></span></p>');
  try {
    const reply = await requestTutor({ language: currentLanguage(), levelId: session.levelId, unitId: session.unitId || undefined, history: session.history });
    if (C !== session) return; // l'apprenant a quitté entre-temps
    const lastUser = [...session.history].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      lastUser.correction = reply.correction;
      lastUser.checked = true;
    }
    session.history.push({ role: 'assistant', text: reply.reply, translit: reply.translit, translation: reply.translation });
    session.busy = false;
    setBao(reply.mood);
    renderLog();
    renderCurrent(reply);
    await say(reply.reply);
    if (C === session && session.handsFree && caps().speech) listen();
    else $('#chat-text')?.focus();
  } catch (err) {
    if (C !== session) return;
    session.busy = false;
    setBao('comfort');
    if (err instanceof GeneratorUnavailable) {
      $('#chat-current').innerHTML = `<div class="speech"><strong>${esc(err.message)}</strong><p class="small muted">Pour l’activer, la personne qui héberge Polyglotte doit définir la variable ANTHROPIC_API_KEY puis lancer <code>npm start</code>. En attendant, les leçons et le jeu de rôle restent disponibles.</p></div>`;
      $('#chat-form').hidden = true;
    } else {
      $('#chat-current').innerHTML = `<div class="speech"><p>${esc(err.message)}</p><button class="btn" id="retry">Réessayer</button></div>`;
      $('#retry').addEventListener('click', ask);
    }
  }
}

function send(text) {
  if (!C || C.busy) return;
  stopSpeaking();
  C.history.push({ role: 'user', text });
  C.learnerTurns += 1;
  $('#chat-text').value = '';
  $('#suggestions').innerHTML = '';
  renderLog();
  // Montre la réplique de l'apprenant pendant que Bao réfléchit.
  $('#chat-log').insertAdjacentHTML('beforeend', `<li class="you pending"><div class="bubble"><span dir="auto">${esc(text)}</span></div></li>`);
  ask();
}

async function listen() {
  if (!C || C.busy || C.listening) return;
  const session = C;
  session.listening = true;
  stopSpeaking();
  const mic = $('#mic');
  mic?.classList.add('listening');
  setBao('listen');
  try {
    const heard = await recognize(course().speechLang, { timeoutMs: 10000 });
    if (C !== session) return;
    session.listening = false;
    mic?.classList.remove('listening');
    if (heard[0]) send(heard[0]);
  } catch (err) {
    if (C !== session) return;
    session.listening = false;
    mic?.classList.remove('listening');
    setBao('comfort');
    toast(err.message);
  }
}

function finish() {
  if (!C) return;
  stopSpeaking();
  const s = C;
  s.done = true;
  const result =
    s.learnerTurns > 0
      ? finishActivity({ before: s.before, summary: { mode: 'chat', answers: s.learnerTurns, correct: s.learnerTurns, wrong: 0, learned: 0, written: 0 } })
      : { gains: [], trophies: [], levelUp: false, after: snapshot() };
  updateBambooCounter();
  const corrections = s.history.filter((m) => m.role === 'user' && m.correction);
  C = null;
  app.innerHTML = `
    <section class="card summary-hero">
      ${bao(s.learnerTurns >= 3 ? 'cheer' : 'happy', 140)}
      <div><p class="eyebrow">Conversation terminée</p>
      <h1>${s.learnerTurns ? `${s.learnerTurns} réplique${s.learnerTurns > 1 ? 's' : ''} échangée${s.learnerTurns > 1 ? 's' : ''}` : 'À bientôt !'}</h1>
      <p class="muted">Parler, même avec des erreurs, est le meilleur entraînement. Bao a hâte de recommencer.</p></div>
    </section>
    ${rewardsHtml(result)}
    ${corrections.length ? `<section class="card"><h2>Ce que Bao vous a appris</h2><ul class="item-list">${corrections
      .map((m) => `<li><span><s class="muted" dir="auto">${esc(m.correction.original || m.text)}</s><br><strong dir="auto">${esc(m.correction.corrected)}</strong><br><span class="small muted">${esc(m.correction.explanation)}</span></span></li>`)
      .join('')}</ul></section>` : ''}
    <div class="stack"><a class="btn primary block" href="#/converser">Nouvelle conversation</a><a class="btn block" href="#/">Retour à l’accueil</a></div>`;
}

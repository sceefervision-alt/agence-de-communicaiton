// État partagé de l'interface et petits composants réutilisés par les vues.

import * as store from './storage.js';
import { buildCourse } from './course.js';
import { allItems } from './session.js';
import { findLanguage } from './languages.js';
import { weeklyStatus, levelStatus, recalledCount, logActivity } from './progress.js';
import { sessionEarnings, applyEarnings, newTrophies } from './rewards.js';
import { panda } from './panda.js';
import { speak, canSpeak, canRecognize } from './speech.js';

export let state = store.load();
export const app = document.getElementById('app');

export function replaceState(next) {
  state = next;
  invalidateCourse();
}

export const persist = () => store.save(state);

// ---------- Utilitaires DOM ----------

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
export const $ = (sel, root = app) => root.querySelector(sel);
export const $$ = (sel, root = app) => [...root.querySelectorAll(sel)];
export const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 2800);
}

const ICONS = {
  speaker: '<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  play: '<path d="M7 5v14l11-7z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  dialogue: '<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M17 9h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v3l-4-3h-4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
};
export const icon = (name, size = 18) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

export const bambooIcon = (size = 16) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><rect x="10" y="2" width="4" height="20" rx="2" fill="#4caf6e"/><path d="M10 8h4M10 14h4" stroke="#2f7d4c" stroke-width="1.5"/><ellipse cx="17" cy="6" rx="4" ry="1.6" fill="#6cc98b" transform="rotate(-25 17 6)"/></svg>`;

// ---------- Cours courant ----------

let courseCache = null;
export function invalidateCourse() {
  courseCache = null;
}

export function course() {
  if (!courseCache || courseCache.id !== state.settings.course) {
    courseCache = buildCourse(state.settings.course, { generated: state.generated, customLanguages: state.customLanguages }) ?? buildCourse('es');
  }
  return courseCache;
}

export const currentLanguage = () => findLanguage(course().id, state.customLanguages);
export const cards = () => (state.cards[course().id] ??= {});
export const custom = () => (state.custom[course().id] ??= []);
export const extraAlts = () => (state.extraAlts[course().id] ??= {});
export const items = () => allItems(course(), custom(), extraAlts());
export const langName = () => course().name.toLowerCase();
export const caps = () => ({
  audio: state.settings.audio && canSpeak() && !!course().speechLang,
  speech: state.settings.speaking && canRecognize() && !!course().speechLang,
});
export const say = (text, rate) => (caps().audio ? speak(text, course().speechLang, rate ? { rate } : undefined) : Promise.resolve());

export const level = () => levelStatus(course(), cards());
export const stage = () => Math.min(5, level().levelsDone);

// Bao, habillé selon le niveau et la boutique.
export function bao(mood = 'happy', size = 120, extra = {}) {
  return panda({ mood, size, stage: extra.stage ?? stage(), equipped: state.rewards.equipped, label: extra.label ?? '', className: extra.className ?? '' });
}

export function baoSays(mood, text, { size = 110, className = '' } = {}) {
  return `<div class="bao-says ${className}">${bao(mood, size)}<div class="speech">${text}</div></div>`;
}

// ---------- Petits composants ----------

export function audioBtn(text, label = 'Écouter') {
  if (!caps().audio || !text) return '';
  return `<button class="btn ghost audio-btn" data-say="${esc(text)}" aria-label="${esc(label)}" title="${esc(label)}">${icon('speaker')}</button>`;
}

export function bindAudio(root = app) {
  $$('[data-say]', root).forEach((b) => b.addEventListener('click', () => say(b.dataset.say)));
}

export function targetText(text, translit, { big = false } = {}) {
  const dir = course().rtl ? 'rtl' : 'auto';
  return `<span class="target ${big ? 'target-big' : ''}" dir="${dir}" lang="${esc(course().speechLang || '')}">${esc(text)}</span>${translit ? `<span class="translit">${esc(translit)}</span>` : ''}`;
}

export function weekWidget() {
  const w = weeklyStatus(state.log, state.settings.weeklyGoal, Date.now());
  const left = Math.max(0, w.goal - w.active);
  return `
    <div class="row spread"><h2>Objectif de la semaine</h2><span class="badge ${w.reached ? 'ok' : ''}">${w.active} / ${w.goal} jours</span></div>
    <div class="week" aria-label="Jours actifs cette semaine">
      ${w.days.map((d) => `<span class="day ${d.active ? 'active' : ''} ${d.today ? 'today' : ''} ${d.future ? 'future' : ''}" title="${d.key}">${d.label}</span>`).join('')}
    </div>
    <p class="muted small">${
      w.reached
        ? 'Objectif atteint ! Le coffre surprise de la semaine est ouvert. Le reste, c’est du bonus — ou du repos bien mérité.'
        : `Encore ${plural(left, 'jour', 'jours')} cette semaine pour ouvrir le coffre surprise. Les jours de repos ne vous font rien perdre.`
    }</p>`;
}

// ---------- Bilan d'activité : bambous, trophées, niveau ----------

export function snapshot() {
  const ls = level();
  return { recalled: recalledCount(items(), cards()), units: ls.unitsDone, levelsDone: ls.levelsDone };
}

function languagesStarted() {
  return Object.values(state.cards).filter((c) => Object.keys(c).length > 0).length;
}

// Appelé à la fin d'une session ou d'une conversation.
export function finishActivity({ before, summary }) {
  const now = Date.now();
  if (summary.answers > 0) state.log = logActivity(state.log, { answers: summary.answers, correct: summary.correct }, now);
  const after = snapshot();
  const weeklyReached = weeklyStatus(state.log, state.settings.weeklyGoal, now).reached;
  const gains = summary.answers > 0 ? sessionEarnings({ before, after, summary, weeklyReached, rewards: state.rewards, langId: course().id, now }) : [];
  state.rewards = applyEarnings(state.rewards, gains, { langId: course().id, levelsDone: after.levelsDone, now });

  const st = state.rewards.stats;
  if (summary.answers > 0) {
    if (summary.mode === 'chat') st.chats += 1;
    else st.sessions += 1;
    if (summary.mode === 'role') st.roleplays += 1;
    if (summary.answers >= 6 && summary.wrong === 0 && summary.mode !== 'chat') st.perfect += 1;
  }
  const trophies = newTrophies(state.rewards, {
    ...st,
    recalled: after.recalled,
    units: after.units,
    levelsDone: after.levelsDone,
    languages: languagesStarted(),
    owned: state.rewards.owned.length,
  });
  for (const t of trophies) state.rewards.trophies[t.id] = t.at;
  persist();
  return { gains, trophies, levelUp: after.levelsDone > before.levelsDone, after };
}

export function rewardsHtml({ gains, trophies, levelUp, after }) {
  const total = gains.reduce((a, g) => a + g.amount, 0);
  let html = '';
  if (levelUp) {
    const lv = course().levels[Math.min(after.levelsDone, 5)];
    html += `<section class="card levelup">
      ${bao('cheer', 150)}
      <div><p class="eyebrow">Nouveau niveau</p><h2>Bao a grandi !</h2>
      <p>Vous passez au niveau ${esc(lv.cefr)} · ${esc(lv.name)}. Regardez sa nouvelle tenue — et l’interface s’enrichit avec vous.</p></div>
    </section>`;
  }
  if (total > 0) {
    html += `<section class="card gains"><div class="row spread"><h2>Bonus gagnés</h2><span class="bamboo-pill big">${bambooIcon(20)} +${total}</span></div>
      <ul class="gain-list">${gains.map((g) => `<li class="${g.chest ? 'chest' : ''}"><span>${esc(g.reason)}</span><strong>+${g.amount}</strong></li>`).join('')}</ul>
      <p class="muted small">Dépensez vos bambous dans la boutique de Bao.</p></section>`;
  }
  if (trophies.length) {
    html += `<section class="card"><h2>Trophée${trophies.length > 1 ? 's' : ''} débloqué${trophies.length > 1 ? 's' : ''}</h2>
      <div class="trophies">${trophies.map((t) => `<div class="trophy got">${icon('sparkle', 22)}<strong>${esc(t.name)}</strong><span>${esc(t.desc)}</span></div>`).join('')}</div></section>`;
  }
  return html;
}

export function updateBambooCounter() {
  const el = document.getElementById('bamboo-count');
  if (el) el.innerHTML = `${bambooIcon(16)} ${state.rewards.bamboo}`;
}

// Révélation des récompenses : un coffre ou un cadeau en 3D qu'on touche
// pour l'ouvrir, puis le gain s'affiche (compteur animé + confettis).
// Les révélations s'enchaînent dans une file d'attente.

import { load3D, get3D, baoSlot } from './visual.js';
import { confetti } from './confetti.js';

const queue = [];
let active = false;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function reveal(item) {
  queue.push(item);
  if (!active) next();
}

function countUp(el, to) {
  const start = performance.now();
  const dur = 900;
  const step = (now) => {
    const k = Math.min(1, (now - start) / dur);
    el.textContent = `+${Math.round(to * (1 - (1 - k) ** 3))}`;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function next() {
  const item = queue.shift();
  if (!item) {
    active = false;
    return;
  }
  active = true;
  await load3D();
  const st = get3D();
  const openable = item.kind === 'chest' || item.kind === 'gift';

  const overlay = document.createElement('div');
  overlay.className = 'reveal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', item.title);
  overlay.innerHTML = `
    <div class="reveal-card">
      <p class="eyebrow">${esc(item.eyebrow ?? 'Bonus')}</p>
      <h2>${esc(item.title)}</h2>
      <div class="reveal-stage ${openable ? 'openable' : ''}" id="reveal-stage">
        ${openable ? (st ? '' : `<div class="css-gift ${item.kind}"></div>`) : baoSlot({ ...(item.bao ?? {}), size: 220, live: true })}
      </div>
      <p class="reveal-hint">${openable ? 'Touchez pour ouvrir' : ''}</p>
      <div class="reveal-result" ${openable ? 'hidden' : ''}>
        ${item.amount ? `<p class="reveal-amount"><span class="amount">+0</span> bambous</p>` : ''}
        ${item.text ? `<p class="muted">${esc(item.text)}</p>` : ''}
        ${item.resultHtml ?? ''}
      </div>
      <button class="btn primary" id="reveal-btn">${openable ? 'Ouvrir' : 'Merveilleux !'}</button>
    </div>`;
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('in'));

  const stageEl = overlay.querySelector('#reveal-stage');
  const btn = overlay.querySelector('#reveal-btn');
  const result = overlay.querySelector('.reveal-result');
  let chest = null;
  let opened = !openable;

  if (openable && st) chest = st.mountChest(stageEl, { kind: item.kind, color: item.color, ribbon: item.ribbon });
  if (!openable) confetti();

  const showResult = () => {
    result.hidden = false;
    overlay.querySelector('.reveal-hint').textContent = '';
    const amount = overlay.querySelector('.amount');
    if (amount) countUp(amount, item.amount);
    confetti();
    btn.textContent = 'Super !';
    btn.disabled = false;
    btn.focus();
  };

  const open = () => {
    if (opened) return close();
    opened = true;
    btn.disabled = true;
    if (chest) {
      chest.open();
      setTimeout(showResult, 1500);
    } else {
      stageEl.querySelector('.css-gift')?.classList.add('open');
      setTimeout(showResult, 500);
    }
  };

  const close = () => {
    overlay.classList.remove('in');
    overlay.classList.add('out');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => {
      overlay.remove();
      next();
    }, 320);
  };

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);
  btn.addEventListener('click', () => (opened ? close() : open()));
  if (openable) stageEl.addEventListener('click', () => !opened && open());
  btn.focus();
}

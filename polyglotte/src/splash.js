// Animation d'ouverture de l'application : les bambous poussent, Bao tombe
// du ciel, rebondit et salue, puis le logo apparaît. On peut la passer d'un
// geste. Sans 3D, une version 2D animée prend le relais.

import { load3D } from './visual.js';
import { panda } from './panda.js';

export function playSplash({ stage = 0, equipped = {} } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'splash';
    overlay.innerHTML = `
      <div class="splash-stage" id="splash-stage"></div>
      <div class="splash-brand">
        <img src="icons/icon.svg" alt="" width="64" height="64" />
        <h1>Polyglotte</h1>
        <p>Toutes les langues, du débutant au senior.<br>Pour les pros qui voyagent.</p>
      </div>
      <p class="splash-skip">Touchez pour commencer</p>`;
    document.body.append(overlay);
    document.body.classList.add('splashing');

    let handle = null;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      overlay.classList.add('out');
      document.body.classList.remove('splashing');
      setTimeout(() => {
        handle?.destroy();
        overlay.remove();
      }, 700);
      resolve();
    };
    overlay.addEventListener('click', finish);
    document.addEventListener('keydown', finish, { once: true });

    const timeout = new Promise((r) => setTimeout(() => r(null), 2500));
    Promise.race([load3D(), timeout]).then((st) => {
      if (done) return;
      const stageEl = overlay.querySelector('#splash-stage');
      handle = st ? st.mountSplash(stageEl, { stage, equipped }) : null;
      if (!handle) {
        stageEl.innerHTML = `<div class="splash-fallback">${panda({ mood: 'wave', size: 220, stage, equipped })}</div>`;
      }
      overlay.classList.add('play');
      setTimeout(finish, ((handle?.duration ?? 2.4) + 0.9) * 1000);
    });
  });
}

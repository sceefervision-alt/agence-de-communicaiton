// Le ciel en haut de l'application suit l'heure de l'apprenant : soleil du
// matin bas à l'est, soleil de midi au zénith, soleil du soir qui se couche,
// puis la lune et les étoiles. Il se met à jour toutes les minutes.

import { t, N } from './i18n.js';

// 6 h → 21 h : course du soleil ; 21 h → 6 h : course de la lune.
const SUNRISE = 6;
const SUNSET = 21;

export function dayPeriod(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= SUNRISE && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'noon';
  if (h >= 17 && h < SUNSET) return 'evening';
  return 'night';
}

// Position de l'astre dans sa piste (entre le logo et le compteur de
// bambous), en pourcentage : x de gauche à droite, y de haut en bas, sur un
// arc qui culmine au milieu de sa course.
export function celestialPosition(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;
  const night = h >= SUNSET || h < SUNRISE;
  const progress = night ? ((h < SUNRISE ? h + 24 : h) - SUNSET) / (24 - SUNSET + SUNRISE) : (h - SUNRISE) / (SUNSET - SUNRISE);
  return { body: night ? 'moon' : 'sun', x: 4 + progress * 92, y: 72 - Math.sin(progress * Math.PI) * 38 };
}

const GREETING = { morning: N('Bonjour'), noon: N('Bon après-midi'), evening: N('Bonsoir'), night: N('Bonne nuit') };
const LABEL = { morning: N('Soleil du matin'), noon: N('Soleil de midi'), evening: N('Soleil du soir'), night: N('Lune et étoiles') };

export const greeting = (date = new Date()) => t(GREETING[dayPeriod(date)]);

// Étoiles à positions fixes (x %, y %, taille px, délai s).
const STARS = [
  [6, 22, 2, 0], [14, 58, 1.5, 1.2], [21, 30, 2.5, 0.6], [29, 64, 1.5, 2], [36, 18, 2, 1.6], [44, 48, 1.5, 0.3],
  [52, 26, 2, 2.4], [61, 60, 1.5, 0.9], [68, 16, 2.5, 1.9], [75, 44, 1.5, 0.5], [83, 24, 2, 2.2], [91, 54, 1.5, 1.1], [96, 14, 2, 0.7],
];

function sceneHtml(date) {
  const period = dayPeriod(date);
  const pos = celestialPosition(date);
  const star = period === 'night' ? STARS.map(([x, y, s, d]) => `<i class="star" style="left:${x}%;top:${y}%;--s:${s}px;--d:${d}s"></i>`).join('') : '';
  const clouds = period === 'night' ? '' : '<i class="cloud c1"></i><i class="cloud c2"></i><i class="cloud c3"></i>';
  const orb = pos.body === 'sun' ? '<span class="sun"><span class="rays"></span><span class="disc"></span></span>' : '<span class="moon"><span class="disc"></span></span>';
  return `
    ${star}
    <span class="orb-track">${clouds}<span class="orb" style="left:${pos.x.toFixed(1)}%;top:${pos.y.toFixed(1)}%">${orb}</span></span>
    <svg class="hills" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
      <path class="hill-back" d="M0 26 C60 8 110 10 170 22 S300 6 400 18 V40 H0Z" />
      <path class="hill-front" d="M0 34 C80 20 140 26 210 32 S330 22 400 30 V40 H0Z" />
    </svg>`;
}

let timer = null;

export function renderSky(date = new Date()) {
  const header = document.getElementById('sky');
  const scene = document.getElementById('sky-scene');
  if (!header || !scene) return;
  const period = dayPeriod(date);
  header.dataset.period = period;
  scene.innerHTML = sceneHtml(date);
  scene.setAttribute('aria-label', t(LABEL[period]));
  const hello = document.getElementById('sky-greeting');
  if (hello) hello.textContent = greeting(date);
}

export function startSky() {
  renderSky();
  clearInterval(timer);
  timer = setInterval(renderSky, 60 * 1000);
  document.addEventListener('visibilitychange', () => !document.hidden && renderSky());
}

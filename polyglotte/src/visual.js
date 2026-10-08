// Pont entre l'interface et la 3D. Les vues écrivent de simples
// emplacements (<span class="bao3d">, <div class="garden3d">) contenant une
// version 2D de secours ; dès que le moteur 3D est chargé, ces emplacements
// sont « hydratés » : Bao animé pour les grands formats, vignette 3D figée
// pour les petits. Sans WebGL, la version 2D reste affichée.

let stage = null;
let loading = null;

export function load3D() {
  loading ??= import('./three/stage.js')
    .then((m) => {
      if (m.is3DAvailable()) {
        stage = m;
        document.documentElement.classList.add('has-3d');
        hydrate(document.body);
      }
      return stage;
    })
    .catch((err) => {
      console.warn('3D non chargée :', err);
      return null;
    });
  return loading;
}

export const get3D = () => stage;

const enc = (o) => encodeURIComponent(JSON.stringify(o));
const dec = (s) => JSON.parse(decodeURIComponent(s));

// Emplacement pour Bao. `live` : animé (réagit, suit le regard) ; sinon vignette.
export function baoSlot({ mood = 'happy', size = 120, stage: st = 0, equipped = {}, live, label = '', fallback = '', className = '', framing } = {}) {
  const isLive = live ?? size >= 110;
  const data = enc({ mood, size, stage: st, equipped, live: isLive, framing });
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<span class="bao3d ${className}" data-bao="${data}" style="--s:${size}px" ${a11y}>${fallback}</span>`;
}

export function gardenSlot(opts, fallback = '') {
  return `<div class="garden3d" data-garden="${enc(opts)}">${fallback}</div>`;
}

function hydrateBao(el) {
  const o = dec(el.dataset.bao);
  el.dataset.h = '1';
  if (o.live) {
    el.textContent = '';
    const ctrl = stage.mountBao(el, o);
    if (ctrl) {
      el._bao = ctrl;
      el.classList.add('is-live');
    }
  } else {
    const url = stage.baoImage(o);
    if (url) el.innerHTML = `<img src="${url}" alt="" draggable="false" />`;
  }
}

function hydrateGarden(el) {
  el.dataset.h = '1';
  const o = dec(el.dataset.garden);
  el.textContent = '';
  stage.mountGarden(el, o);
}

export function hydrate(root = document.body) {
  if (!stage || !root?.querySelectorAll) return;
  root.querySelectorAll('.bao3d[data-bao]:not([data-h])').forEach(hydrateBao);
  root.querySelectorAll('.garden3d[data-garden]:not([data-h])').forEach(hydrateGarden);
}

// Hydrate automatiquement tout ce qui apparaît dans la page.
let scheduled = false;
new MutationObserver(() => {
  if (scheduled || !stage) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    hydrate(document.body);
  });
}).observe(document.documentElement, { childList: true, subtree: true });

// Change l'humeur d'un Bao animé déjà affiché (sinon renvoie false).
export function setSlotMood(el, mood) {
  if (el?._bao) {
    el._bao.setMood(mood);
    return true;
  }
  return false;
}

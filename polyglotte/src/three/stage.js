// Scènes prêtes à l'emploi pour l'interface : Bao seul, le jardin, un coffre
// ou un cadeau, et l'animation d'ouverture de l'application.

import { THREE, createView, snapshot, studioLights, contactShadow, is3DAvailable, reducedMotion } from './engine.js';
import { createBao } from './bao3d.js';
import { createGarden, SKIES } from './garden3d.js';
import { createChest } from './chest3d.js';

const { Scene, PerspectiveCamera, Group } = THREE;

export { is3DAvailable };

function baoScene({ mood, stage, equipped, framing = 'full' }) {
  const scene = new Scene();
  studioLights(scene);
  contactShadow(scene);
  const bao = createBao({ mood, stage, equipped });
  scene.add(bao.object);
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  if (framing === 'face') {
    camera.position.set(0, 1.85, 4.6);
    camera.lookAt(0, 1.7, 0);
  } else {
    camera.position.set(0, 1.5, 7.4);
    camera.lookAt(0, 1.32, 0);
  }
  return { scene, camera, bao };
}

// Bao animé (accueil, réactions, conversation) : il suit le pointeur du
// regard et sautille quand on le touche.
export function mountBao(container, { mood = 'happy', stage = 0, equipped = {}, framing } = {}) {
  const { scene, camera, bao } = baoScene({ mood, stage, equipped, framing });
  bao.update(0, 0, { instant: true });
  const view = createView(container, {
    scene,
    camera,
    update: (t, dt) => bao.update(t, dt),
    onPointer: (x, y) => bao.look(x, y),
    onTap: () => bao.boop(),
  });
  if (!view) return null;
  return {
    setMood: (m) => bao.setMood(m),
    setOutfit: (s, e) => bao.setOutfit(s, e),
    boop: () => bao.boop(),
    destroy: () => view.destroy(),
  };
}

// Vignette figée de Bao (listes, boutique…), mise en cache.
export function baoImage({ mood = 'happy', stage = 0, equipped = {}, size = 96, framing } = {}) {
  return snapshot(`bao|${mood}|${stage}|${JSON.stringify(equipped)}|${framing ?? ''}`, () => {
    const { scene, camera, bao } = baoScene({ mood, stage, equipped, framing });
    return { scene, camera, update: () => bao.update(0.6, 0, { instant: true }) };
  }, size, size);
}

export function mountGarden(container, opts = {}) {
  const g = createGarden(opts);
  const view = createView(container, {
    scene: g.scene,
    camera: g.camera,
    update: g.update,
    onPointer: (x, y) => g.bao.look(x * 0.6, y * 0.4),
    onTap: () => g.bao.boop(),
  });
  return view ? { destroy: () => view.destroy() } : null;
}

export function gardenImage(opts, w, h) {
  return snapshot(`garden|${JSON.stringify(opts)}`, () => {
    const g = createGarden(opts);
    return { scene: g.scene, camera: g.camera, update: (t) => g.update(t, 0) };
  }, w, h);
}

export function mountChest(container, { kind = 'chest', color, ribbon } = {}) {
  const scene = new Scene();
  studioLights(scene);
  contactShadow(scene, { opacity: 0.22 });
  const chest = createChest({ kind, color, ribbon });
  chest.object.position.y = 0.05;
  scene.add(chest.object);
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 2.3, 6.4);
  camera.lookAt(0, 1.05, 0);
  const view = createView(container, { scene, camera, update: chest.update });
  if (!view) return null;
  return { open: () => chest.open(), get phase() {
    return chest.phase;
  }, destroy: () => view.destroy() };
}

// Animation d'ouverture : les bambous poussent, Bao tombe du ciel, rebondit
// et salue. Renvoie une promesse résolue à la fin (≈ 3,4 s).
export function mountSplash(container, { stage = 0, equipped = {} } = {}) {
  const g = createGarden({ stalks: 9, level: 1, decor: ['cherry', 'lantern'], mood: 'surprise', stage, equipped });
  const bao = g.bao;
  const bambooGroups = g.bamboos;
  const easeOut = (x) => 1 - (1 - x) ** 3;
  let waved = false;
  const fast = reducedMotion();

  const update = (t, dt) => {
    g.update(t, dt);
    // Caméra : léger travelling avant
    const k = Math.min(1, t / 3.2);
    // Écran en portrait : on recule pour voir toute l'île.
    const portrait = Math.max(1, 1.25 / Math.max(0.35, g.camera.aspect));
    g.camera.position.set(0, (3.4 - easeOut(k) * 0.6) * (0.85 + portrait * 0.15), (14 - easeOut(k) * 2.6) * portrait);
    g.camera.lookAt(0, portrait > 1.2 ? 0.4 : 0.9, 0);
    // Les bambous poussent un à un
    bambooGroups.forEach((s, i) => {
      const grow = Math.min(1, Math.max(0, (t - 0.15 - i * 0.08) / 0.7));
      s.visible = grow > 0.03;
      s.scale.set(1, Math.max(0.03, easeOut(grow)), 1);
    });
    // Bao tombe, rebondit (écrasement), puis salue
    const fall = t - 0.9;
    let y = 0;
    if (fall < 0) y = 6;
    else if (fall < 0.45) y = 6 * (1 - (fall / 0.45) ** 2);
    else if (fall < 0.8) {
      const b = (fall - 0.45) / 0.35;
      y = Math.sin(b * Math.PI) * 0.5;
    }
    bao.object.position.y = y;
    const squash = fall > 0.42 && fall < 0.55 ? 1 - Math.sin(((fall - 0.42) / 0.13) * Math.PI) * 0.18 : 1;
    bao.object.scale.set(0.62 * (2 - squash), 0.62 * squash, 0.62 * (2 - squash));
    if (fall > 0.9 && !waved) {
      bao.setMood('wave');
      waved = true;
    }
  };
  const view = createView(container, { scene: g.scene, camera: g.camera, update });
  if (!view) return null;
  if (fast) bao.setMood('wave');
  return { destroy: () => view.destroy(), duration: fast ? 0.8 : 3.4 };
}

export { SKIES };

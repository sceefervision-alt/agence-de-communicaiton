// Bao en 3D, style dessin animé (cel-shading) : un panda construit à partir
// de formes simples (sphères, capsules, tores), ombré en aplats et cerné
// d'un contour encré. Chaque humeur
// combine une expression et une pose ; les animations (respiration,
// clignement, coucou, saut avec écrasement…) sont calculées en continu.

import { THREE } from './engine.js';
import { toon, addOutlines } from './toon.js';

const { Group, Mesh, SphereGeometry, CapsuleGeometry, TorusGeometry, CylinderGeometry, ConeGeometry, BoxGeometry, MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, Sprite, SpriteMaterial, CanvasTexture, ExtrudeGeometry, Shape, OctahedronGeometry, DoubleSide, SRGBColorSpace } = THREE;

// ---------- Matériaux et géométries partagés ----------

const cache = new Map();
const once = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

// Palette dessin animé : couleurs franches, ombrage en aplats (cel-shading).
const M = {
  fur: () => once('fur', () => toon(0xffffff)),
  dark: () => once('dark', () => toon(0x262c46)),
  eyeWhite: () => once('eyeWhite', () => new MeshBasicMaterial({ color: 0xffffff })),
  pupil: () => once('pupil', () => toon(0x101426)),
  glint: () => once('glint', () => new MeshBasicMaterial({ color: 0xffffff })),
  glossBlack: () => once('glossBlack', () => toon(0x151826)),
  mouth: () => once('mouth', () => toon(0x4a1f33)),
  tongue: () => once('tongue', () => toon(0xff6f92)),
  blush: () => once('blush', () => new MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0.75 })),
  pad: () => once('pad', () => toon(0xffb8cb)),
  white: () => once('white', () => new MeshBasicMaterial({ color: 0xffffff })),
  color: (hex, opts = {}) => once(`c${hex}${JSON.stringify(opts)}`, () => toon(hex, opts)),
  fabric: (hex) => once(`f${hex}`, () => toon(hex)),
  gold: () => once('gold', () => toon(0xffc83d)),
  glow: (hex) => once(`g${hex}`, () => new MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 1.6, roughness: 0.4 })),
};

const G = {
  sphere: () => once('gs', () => new SphereGeometry(1, 48, 32)),
  sphereLo: () => once('gsl', () => new SphereGeometry(1, 20, 14)),
  capsule: () => once('gc', () => new CapsuleGeometry(1, 1, 8, 20)),
  arc: () => once('ga', () => new TorusGeometry(1, 0.22, 12, 32, Math.PI)),
  ring: () => once('gr', () => new TorusGeometry(1, 0.12, 14, 48)),
};

function mesh(geo, mat, { p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], shadow = true } = {}) {
  const m = new Mesh(geo, mat);
  m.position.set(...p);
  m.scale.set(...(typeof s === 'number' ? [s, s, s] : s));
  m.rotation.set(...r);
  m.castShadow = shadow;
  if (!shadow) m.userData.noOutline = true;
  return m;
}

function textSprite(text, color = '#2a57b8', size = 128) {
  return once(`sprite${text}${color}`, () => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = `700 ${size * 0.72}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2 + 4);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return new SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  });
}

function heartGeometry() {
  return once('heart', () => {
    const s = new Shape();
    s.moveTo(0, -0.35);
    s.bezierCurveTo(-0.15, -0.2, -0.5, 0, -0.5, 0.22);
    s.bezierCurveTo(-0.5, 0.42, -0.3, 0.52, -0.18, 0.52);
    s.bezierCurveTo(-0.07, 0.52, 0, 0.44, 0, 0.36);
    s.bezierCurveTo(0, 0.44, 0.07, 0.52, 0.18, 0.52);
    s.bezierCurveTo(0.3, 0.52, 0.5, 0.42, 0.5, 0.22);
    s.bezierCurveTo(0.5, 0, 0.15, -0.2, 0, -0.35);
    const g = new ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 6, curveSegments: 24 });
    g.center();
    return g;
  });
}

// ---------- Accessoires ----------

const HEAD_ITEMS = {
  sprout: () => {
    const g = new Group();
    g.add(mesh(G.capsule(), M.color(0x3f9e5f), { p: [0, 0.82, 0.05], s: [0.025, 0.08, 0.025], r: [0.15, 0, 0.1] }));
    g.add(mesh(G.sphere(), M.color(0x5bbf7a), { p: [-0.1, 0.92, 0.06], s: [0.12, 0.035, 0.065], r: [0, 0.2, 0.55] }));
    g.add(mesh(G.sphere(), M.color(0x5bbf7a), { p: [0.1, 0.94, 0.06], s: [0.12, 0.035, 0.065], r: [0, -0.2, -0.55] }));
    return g;
  },
  beret: () => {
    const g = new Group();
    g.add(mesh(G.sphere(), M.fabric(0xc23b4a), { p: [0.1, 0.66, -0.02], s: [0.6, 0.15, 0.58], r: [0.05, 0, -0.26] }));
    g.add(mesh(G.capsule(), M.fabric(0xc23b4a), { p: [0.12, 0.83, -0.02], s: [0.025, 0.04, 0.025] }));
    return g;
  },
  gradcap: () => {
    const g = new Group();
    g.add(mesh(new CylinderGeometry(0.46, 0.52, 0.24, 40), M.fabric(0x17213a), { p: [0, 0.66, 0] }));
    g.add(mesh(new BoxGeometry(1.25, 0.05, 1.25), M.fabric(0x17213a), { p: [0, 0.8, 0], r: [0, Math.PI / 4, 0] }));
    g.add(mesh(G.sphere(), M.gold(), { p: [0, 0.84, 0], s: 0.05 }));
    g.add(mesh(new CylinderGeometry(0.012, 0.012, 0.42, 8), M.gold(), { p: [0.5, 0.62, 0.36], r: [0, 0, 0.08] }));
    g.add(mesh(G.sphere(), M.gold(), { p: [0.51, 0.4, 0.36], s: [0.05, 0.08, 0.05] }));
    return g;
  },
  crown: () => {
    const g = new Group();
    g.add(mesh(new CylinderGeometry(0.36, 0.4, 0.18, 32, 1, true), M.gold(), { p: [0, 0.72, 0] }));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      g.add(mesh(new ConeGeometry(0.07, 0.18, 12), M.gold(), { p: [Math.sin(a) * 0.37, 0.89, Math.cos(a) * 0.37] }));
      g.add(mesh(G.sphereLo(), M.color(i % 2 ? 0xe85d75 : 0x5b8def, { roughness: 0.1, clearcoat: 1 }), { p: [Math.sin(a) * 0.4, 0.72, Math.cos(a) * 0.4], s: 0.045 }));
    }
    return g;
  },
  flowers: () => {
    const g = new Group();
    const colors = [0xff8aa5, 0xffd166, 0x9ad0f5, 0xffffff, 0xc9a7f5];
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 1.9;
      const f = new Group();
      f.position.set(Math.sin(a) * 0.74, 0.47 + Math.cos(a) * 0.07, Math.cos(a) * 0.68);
      f.lookAt(f.position.clone().multiplyScalar(2));
      for (let k = 0; k < 5; k++) {
        const b = (k / 5) * Math.PI * 2;
        f.add(mesh(G.sphereLo(), M.color(colors[i % colors.length]), { p: [Math.cos(b) * 0.06, Math.sin(b) * 0.06, 0], s: [0.055, 0.055, 0.025], shadow: false }));
      }
      f.add(mesh(G.sphereLo(), M.color(0xffc23d), { p: [0, 0, 0.015], s: 0.035, shadow: false }));
      g.add(f);
    }
    return g;
  },
  cap: () => {
    const g = new Group();
    g.add(mesh(new SphereGeometry(0.6, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.fabric(0x2a57b8), { p: [0, 0.38, 0], s: [1.08, 0.95, 1.05] }));
    g.add(mesh(G.sphere(), M.fabric(0x17213a), { p: [0, 0.42, 0.62], s: [0.42, 0.035, 0.32] }));
    g.add(mesh(G.sphereLo(), M.fabric(0x17213a), { p: [0, 0.95, 0], s: 0.05 }));
    return g;
  },
  beanie: () => {
    const g = new Group();
    g.add(mesh(new SphereGeometry(0.62, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.fabric(0xe85d75), { p: [0, 0.34, 0], s: [1.08, 1.05, 1.05] }));
    g.add(mesh(G.ring(), M.fabric(0xf7d6dd), { p: [0, 0.36, 0], s: [0.66, 0.66, 0.66], r: [Math.PI / 2, 0, 0] }));
    g.add(mesh(G.sphere(), M.fabric(0xf7d6dd), { p: [0, 1.0, 0], s: 0.15 }));
    return g;
  },
  straw: () => {
    const g = new Group();
    g.add(mesh(new CylinderGeometry(0.98, 0.98, 0.035, 48), M.color(0xe9c97e, { roughness: 0.9, clearcoat: 0 }), { p: [0, 0.6, 0], r: [-0.08, 0, 0] }));
    g.add(mesh(new CylinderGeometry(0.42, 0.5, 0.32, 40), M.color(0xf0d58f, { roughness: 0.9, clearcoat: 0 }), { p: [0, 0.76, -0.02] }));
    g.add(mesh(new CylinderGeometry(0.505, 0.505, 0.08, 40), M.fabric(0x2a57b8), { p: [0, 0.66, -0.02] }));
    return g;
  },
};

const EYE_ITEMS = {
  round: () => {
    const g = new Group();
    for (const x of [-0.28, 0.28]) g.add(mesh(G.ring(), M.gold(), { p: [x, 0.02, 0.86], s: [0.16, 0.16, 0.2] }));
    g.add(mesh(new TorusGeometry(0.06, 0.016, 8, 16, Math.PI), M.gold(), { p: [0, 0.06, 0.9] }));
    return g;
  },
  sun: () => {
    const g = new Group();
    for (const x of [-0.28, 0.28]) g.add(mesh(G.sphere(), M.glossBlack(), { p: [x, 0.03, 0.86], s: [0.19, 0.14, 0.05] }));
    g.add(mesh(new BoxGeometry(0.2, 0.03, 0.03), M.glossBlack(), { p: [0, 0.07, 0.9] }));
    return g;
  },
};

const NECK_ITEMS = {
  scarf: (hex = 0x2a57b8) => {
    const g = new Group();
    g.add(mesh(G.ring(), M.fabric(hex), { p: [0, 1.25, 0.02], s: [0.66, 0.66, 1.35], r: [Math.PI / 2 - 0.12, 0, 0] }));
    g.add(mesh(G.capsule(), M.fabric(hex), { p: [0.3, 0.98, 0.6], s: [0.1, 0.18, 0.05], r: [0.3, 0, 0.18] }));
    return g;
  },
  redscarf: () => NECK_ITEMS.scarf(0xc23b4a),
  bowtie: (hex = 0x2a57b8) => {
    const g = new Group();
    g.add(mesh(new ConeGeometry(0.12, 0.24, 20), M.fabric(hex), { p: [-0.13, 1.2, 0.66], r: [0, 0, -Math.PI / 2] }));
    g.add(mesh(new ConeGeometry(0.12, 0.24, 20), M.fabric(hex), { p: [0.13, 1.2, 0.66], r: [0, 0, Math.PI / 2] }));
    g.add(mesh(G.sphere(), M.gold(), { p: [0, 1.2, 0.7], s: 0.065 }));
    return g;
  },
  goldbow: () => NECK_ITEMS.bowtie(0xf0c25a),
  lei: () => {
    const g = new Group();
    const colors = [0xff8aa5, 0xffd166, 0x9ad0f5];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      g.add(mesh(G.sphereLo(), M.color(colors[i % 3]), { p: [Math.sin(a) * 0.66, 1.24 - Math.max(0, Math.cos(a)) * 0.1, Math.cos(a) * 0.62], s: 0.08 }));
    }
    return g;
  },
};

const HOLD_ITEMS = {
  heart: () => mesh(heartGeometry(), M.color(0xe85d75, { roughness: 0.25, clearcoat: 1 }), { p: [0, 1.0, 0.92], s: 0.55, r: [0, 0, 0] }),
  book: () => {
    const g = new Group();
    g.add(mesh(new BoxGeometry(0.7, 0.48, 0.1), M.color(0x2a57b8), {}));
    g.add(mesh(new BoxGeometry(0.64, 0.42, 0.11), M.color(0xffffff, { roughness: 0.9, clearcoat: 0 }), { p: [0, 0, 0.01] }));
    g.add(mesh(new BoxGeometry(0.02, 0.44, 0.12), M.color(0x2a57b8), { p: [0, 0, 0.02] }));
    g.position.set(0, 0.98, 0.88);
    g.rotation.x = -0.35;
    return g;
  },
  pencil: () => {
    const g = new Group();
    const p = new Group();
    p.add(mesh(new CylinderGeometry(0.035, 0.035, 0.46, 12), M.color(0xf2c14e), {}));
    p.add(mesh(new ConeGeometry(0.035, 0.09, 12), M.color(0xf4d9b0), { p: [0, -0.275, 0], r: [Math.PI, 0, 0] }));
    p.add(mesh(new CylinderGeometry(0.036, 0.036, 0.06, 12), M.color(0xe85d75), { p: [0, 0.26, 0] }));
    p.position.set(0.28, 1.0, 0.86);
    p.rotation.set(0.3, 0, 0.75);
    g.add(p);
    g.add(mesh(new BoxGeometry(0.55, 0.4, 0.02), M.color(0xffffff, { roughness: 0.9, clearcoat: 0 }), { p: [-0.08, 0.86, 0.86], r: [-0.4, 0, 0.08] }));
    return g;
  },
  medal: () => {
    const g = new Group();
    g.add(mesh(new BoxGeometry(0.06, 0.3, 0.02), M.fabric(0x2a57b8), { p: [-0.07, 1.12, 0.7], r: [0.3, 0, -0.35] }));
    g.add(mesh(new BoxGeometry(0.06, 0.3, 0.02), M.fabric(0x2a57b8), { p: [0.07, 1.12, 0.7], r: [0.3, 0, 0.35] }));
    g.add(mesh(new CylinderGeometry(0.13, 0.13, 0.04, 32), M.gold(), { p: [0, 0.94, 0.78], r: [Math.PI / 2 - 0.3, 0, 0] }));
    return g;
  },
};

// ---------- Humeurs : expression + pose ----------

// Angles des bras : [z, x] (z écarte / lève, x avance).
const POSES = {
  happy: { eyes: 'open', mouth: 'smile', armL: [-0.22, 0], armR: [0.22, 0], tilt: 0 },
  hello: { eyes: 'open', mouth: 'open', armL: [-0.22, 0], armR: [2.45, -0.1], tilt: -0.08, wave: true },
  wave: { eyes: 'happy', mouth: 'open', armL: [-0.22, 0], armR: [2.45, -0.1], tilt: -0.1, wave: true },
  cheer: { eyes: 'happy', mouth: 'open', armL: [-2.6, -0.1], armR: [2.6, -0.1], tilt: 0, jump: true, extra: 'sparkles' },
  think: { eyes: 'up', mouth: 'small', armL: [-0.22, 0], armR: [-0.49, -1.91], tilt: 0.18, extra: 'thought' },
  comfort: { eyes: 'soft', mouth: 'smile', armL: [0.5, -1.15], armR: [-0.5, -1.15], tilt: 0.12, hold: 'heart', extra: 'hearts' },
  sleep: { eyes: 'sleep', mouth: 'o', armL: [0.35, -0.6], armR: [-0.35, -0.6], tilt: 0.28, nod: true, extra: 'zzz' },
  read: { eyes: 'down', mouth: 'smile', armL: [0.5, -1.15], armR: [-0.5, -1.15], tilt: 0.06, hold: 'book' },
  listen: { eyes: 'happy', mouth: 'smile', armL: [-0.22, 0], armR: [0.22, 0], tilt: 0, sway: true, phones: true, extra: 'notes' },
  proud: { eyes: 'wink', mouth: 'open', armL: [-0.22, 0], armR: [2.3, -0.2], tilt: -0.08, hold: 'medal', extra: 'sparkles' },
  surprise: { eyes: 'big', mouth: 'o', armL: [-1.2, -0.3], armR: [1.2, -0.3], tilt: 0, hop: true },
  write: { eyes: 'down', mouth: 'small', armL: [0.45, -1.2], armR: [-0.4, -0.95], tilt: 0.1, hold: 'pencil' },
};

export const MOODS3D = Object.keys(POSES);

// Tenue par défaut selon le niveau (A1 → C2), comme la version 2D.
const STAGES = [
  { head: 'sprout' },
  { head: 'sprout', neck: 'scarf' },
  { neck: 'scarf', eyes: 'round' },
  { head: 'beret', neck: 'scarf', eyes: 'round' },
  { head: 'beret', neck: 'bowtie', eyes: 'round' },
  { head: 'gradcap', neck: 'bowtie', eyes: 'round' },
];

export function outfit3d(stage = 0, equipped = {}) {
  const out = { ...STAGES[Math.max(0, Math.min(5, stage))] };
  for (const slot of ['head', 'eyes', 'neck']) {
    if (equipped[slot] === 'none') delete out[slot];
    else if (equipped[slot]) out[slot] = equipped[slot];
  }
  return out;
}

// Coordonnées de la tête (ellipsoïde) pour poser les traits du visage.
const HEAD = { a: 0.86, b: 0.76, c: 0.78 };
const surfaceZ = (x, y) => HEAD.c * Math.sqrt(Math.max(0, 1 - (x / HEAD.a) ** 2 - (y / HEAD.b) ** 2));

export function createBao({ mood = 'happy', stage = 0, equipped = {} } = {}) {
  const root = new Group();
  const body = new Group();
  root.add(body);

  // Corps, jambes, coussinets, queue
  const torso = mesh(G.sphere(), M.fur(), { p: [0, 0.9, 0], s: [0.74, 0.71, 0.68] });
  body.add(torso);
  for (const x of [-0.36, 0.36]) {
    body.add(mesh(G.sphere(), M.dark(), { p: [x, 0.26, 0.14], s: [0.3, 0.26, 0.36] }));
    body.add(mesh(G.sphere(), M.pad(), { p: [x, 0.24, 0.47], s: [0.13, 0.11, 0.05], shadow: false }));
  }
  body.add(mesh(G.sphere(), M.fur(), { p: [0, 0.55, -0.66], s: 0.15 }));

  // Bras (pivot à l'épaule)
  const arms = {};
  for (const [side, x] of [['L', -0.62], ['R', 0.62]]) {
    const pivot = new Group();
    pivot.position.set(x, 1.32, 0.05);
    pivot.add(mesh(G.capsule(), M.dark(), { p: [0, -0.36, 0], s: [0.19, 0.42, 0.19] }));
    body.add(pivot);
    arms[side] = pivot;
  }

  // Tête
  const head = new Group();
  head.position.set(0, 1.78, 0.02);
  body.add(head);
  head.add(mesh(G.sphere(), M.fur(), { s: [HEAD.a, HEAD.b, HEAD.c] }));
  for (const x of [-0.6, 0.6]) head.add(mesh(G.sphere(), M.dark(), { p: [x, 0.6, -0.1], s: [0.28, 0.28, 0.17] }));
  for (const [x, rz, ry] of [[-0.29, -0.5, -0.38], [0.29, 0.5, 0.38]]) {
    head.add(mesh(G.sphere(), M.dark(), { p: [x, -0.01, surfaceZ(x, 0) - 0.035], s: [0.19, 0.25, 0.085], r: [0, ry, rz], shadow: false }));
  }
  head.add(mesh(G.sphere(), M.fur(), { p: [0, -0.2, surfaceZ(0, -0.2) - 0.09], s: [0.33, 0.22, 0.16], shadow: false }));
  head.add(mesh(G.sphere(), M.glossBlack(), { p: [0, -0.115, 0.805], s: [0.1, 0.068, 0.06], shadow: false }));
  for (const x of [-0.52, 0.52]) head.add(mesh(G.sphere(), M.blush(), { p: [x, -0.17, surfaceZ(x, -0.17) - 0.01], s: [0.14, 0.075, 0.03], r: [0, Math.sign(x) * 0.6, 0], shadow: false }));

  // Yeux : ouverts, fermés (∩), endormis (∪)
  const eyes = { open: new Group(), happy: new Group(), sleep: new Group(), soft: new Group() };
  for (const x of [-0.28, 0.28]) {
    const z = surfaceZ(x, 0.03) + 0.035;
    const e = new Group();
    e.position.set(x, 0.03, z);
    e.add(mesh(G.sphere(), M.eyeWhite(), { s: [0.095, 0.1, 0.06], shadow: false }));
    e.add(mesh(G.sphere(), M.pupil(), { p: [0, -0.005, 0.03], s: [0.07, 0.078, 0.05], shadow: false }));
    e.add(mesh(G.sphereLo(), M.glint(), { p: [0.025, 0.03, 0.08], s: 0.022, shadow: false }));
    e.add(mesh(G.sphereLo(), M.glint(), { p: [-0.02, -0.025, 0.078], s: 0.011, shadow: false }));
    e.userData.pupil = e.children[1];
    eyes.open.add(e);
    eyes.happy.add(mesh(G.arc(), M.white(), { p: [x, 0.0, z + 0.03], s: [0.075, 0.075, 0.06], shadow: false }));
    eyes.soft.add(mesh(G.arc(), M.white(), { p: [x, 0.0, z + 0.03], s: [0.075, 0.045, 0.06], shadow: false }));
    eyes.sleep.add(mesh(G.arc(), M.white(), { p: [x, 0.02, z + 0.03], s: [0.075, 0.05, 0.06], r: [0, 0, Math.PI], shadow: false }));
  }
  const eyeRoot = new Group();
  Object.values(eyes).forEach((g) => eyeRoot.add(g));
  head.add(eyeRoot);

  // Bouches
  const mouths = { smile: new Group(), open: new Group(), o: new Group(), small: new Group() };
  for (const x of [-0.048, 0.048]) mouths.smile.add(mesh(G.arc(), M.mouth(), { p: [x, -0.225, 0.82], s: [0.048, 0.048, 0.04], r: [0, 0, Math.PI], shadow: false }));
  mouths.open.add(mesh(G.sphere(), M.mouth(), { p: [0, -0.27, 0.8], s: [0.085, 0.07, 0.035], shadow: false }));
  mouths.open.add(mesh(G.sphere(), M.tongue(), { p: [0, -0.3, 0.815], s: [0.045, 0.03, 0.02], shadow: false }));
  mouths.o.add(mesh(G.sphere(), M.mouth(), { p: [0, -0.27, 0.805], s: [0.035, 0.045, 0.025], shadow: false }));
  mouths.small.add(mesh(G.arc(), M.mouth(), { p: [0, -0.235, 0.82], s: [0.06, 0.04, 0.04], r: [0, 0, Math.PI], shadow: false }));
  Object.values(mouths).forEach((g) => head.add(g));

  // Emplacements d'accessoires
  const slots = { head: new Group(), eyes: new Group(), neck: new Group(), hold: new Group(), phones: new Group(), extra: new Group() };
  head.add(slots.head, slots.eyes, slots.phones);
  body.add(slots.neck, slots.hold);
  root.add(slots.extra);

  // Casque (humeur « écoute »)
  slots.phones.add(mesh(new TorusGeometry(0.92, 0.055, 12, 48, Math.PI), M.color(0x17213a), { p: [0, 0.05, 0] }));
  for (const x of [-0.9, 0.9]) slots.phones.add(mesh(new CylinderGeometry(0.18, 0.18, 0.14, 28), M.color(0x2a57b8, { clearcoat: 1, roughness: 0.25 }), { p: [x, 0.05, 0], r: [0, 0, Math.PI / 2] }));

  // Effets autour de Bao
  const extras = {
    sparkles: new Group(),
    thought: new Group(),
    zzz: new Group(),
    notes: new Group(),
    hearts: new Group(),
  };
  for (let i = 0; i < 6; i++) {
    const s = mesh(new OctahedronGeometry(0.07, 0), M.glow(0xf2c14e), { shadow: false });
    s.userData.phase = i;
    extras.sparkles.add(s);
  }
  for (let i = 0; i < 3; i++) extras.thought.add(mesh(G.sphereLo(), M.color(0xffffff, { roughness: 0.4 }), { p: [0.95 + i * 0.22, 2.35 + i * 0.25, 0.3], s: 0.06 + i * 0.04, shadow: false }));
  for (let i = 0; i < 3; i++) {
    const z = new Sprite(textSprite('z'));
    z.userData.phase = i / 3;
    extras.zzz.add(z);
  }
  for (let i = 0; i < 3; i++) {
    const n = new Sprite(textSprite(i % 2 ? '♫' : '♪'));
    n.userData.phase = i / 3;
    extras.notes.add(n);
  }
  for (let i = 0; i < 3; i++) {
    const h = mesh(heartGeometry(), M.color(0xff8aa5, { roughness: 0.3, clearcoat: 1 }), { s: 0.16, shadow: false });
    h.userData.phase = i / 3;
    extras.hearts.add(h);
  }
  Object.values(extras).forEach((g) => slots.extra.add(g));

  // ---------- État et animation ----------

  const state = {
    mood,
    pose: { ...POSES[mood] },
    armL: [...POSES[mood].armL],
    armR: [...POSES[mood].armR],
    tilt: POSES[mood].tilt,
    look: [0, 0],
    lookTarget: [0, 0],
    boop: 0,
    blinkAt: 2 + Math.random() * 3,
  };

  function dress(st, eq) {
    const o = outfit3d(st, eq);
    for (const slot of ['head', 'eyes', 'neck']) {
      slots[slot].clear();
      const make = (slot === 'head' ? HEAD_ITEMS : slot === 'eyes' ? EYE_ITEMS : NECK_ITEMS)[o[slot]];
      if (make) slots[slot].add(addOutlines(make(), { thickness: 0.032 }));
    }
  }

  function setMood(m) {
    state.mood = POSES[m] ? m : 'happy';
    const p = POSES[state.mood];
    state.pose = p;
    for (const [k, g] of Object.entries(eyes)) g.visible = k === (p.eyes === 'up' || p.eyes === 'down' || p.eyes === 'big' || p.eyes === 'wink' ? 'open' : p.eyes);
    if (p.eyes === 'wink') {
      eyes.open.children[1].visible = false;
      eyes.happy.visible = true;
      eyes.happy.children[0].visible = false;
    } else {
      eyes.open.children.forEach((c) => (c.visible = true));
      eyes.happy.children.forEach((c) => (c.visible = true));
    }
    const pupilOffset = p.eyes === 'up' ? 0.018 : p.eyes === 'down' ? -0.02 : -0.005;
    eyes.open.children.forEach((e) => {
      e.userData.pupil.position.y = pupilOffset;
      e.scale.setScalar(p.eyes === 'big' ? 1.25 : 1);
    });
    for (const [k, g] of Object.entries(mouths)) g.visible = k === p.mouth;
    slots.hold.clear();
    if (p.hold) slots.hold.add(addOutlines(HOLD_ITEMS[p.hold](), { thickness: 0.025 }));
    slots.phones.visible = !!p.phones;
    slots.head.visible = !p.phones;
    for (const [k, g] of Object.entries(extras)) g.visible = k === p.extra;
  }

  addOutlines(body, { thickness: 0.04 });
  dress(stage, equipped);
  setMood(mood);

  const lerp = (a, b, k) => a + (b - a) * k;

  function update(t, dt, { instant = false } = {}) {
    const p = state.pose;
    const k = instant || dt === 0 ? 1 : 1 - Math.exp(-dt * 9);
    state.armL[0] = lerp(state.armL[0], p.armL[0], k);
    state.armL[1] = lerp(state.armL[1], p.armL[1], k);
    state.armR[0] = lerp(state.armR[0], p.armR[0], k);
    state.armR[1] = lerp(state.armR[1], p.armR[1], k);
    state.tilt = lerp(state.tilt, p.tilt, k);
    state.look[0] = lerp(state.look[0], state.lookTarget[0], dt ? 1 - Math.exp(-dt * 4) : 1);
    state.look[1] = lerp(state.look[1], state.lookTarget[1], dt ? 1 - Math.exp(-dt * 4) : 1);

    // Respiration et petit rebond
    const breathe = Math.sin(t * (p.nod ? 1.3 : 2.2));
    torso.scale.set(0.74 * (1 - breathe * 0.008), 0.71 * (1 + breathe * (p.nod ? 0.03 : 0.015)), 0.68);
    let y = 0;
    let sy = 1;
    let sx = 1;
    if (p.jump) {
      const ph = (t * 1.9) % 1;
      y = 1.4 * ph * (1 - ph);
      const land = ph < 0.1 ? 1 - ph / 0.1 : ph > 0.9 ? (ph - 0.9) / 0.1 : 0;
      sy = 1 - land * 0.1;
      sx = 1 + land * 0.06;
    } else if (p.hop) {
      y = Math.max(0, Math.sin(t * 6)) * 0.08 * Math.max(0, 1 - t * 0.5);
    } else {
      y = Math.sin(t * 2) * 0.02;
    }
    // « Boop » : petit saut quand on touche Bao
    if (state.boop > 0) {
      state.boop = Math.max(0, state.boop - dt);
      const b = Math.sin((1 - state.boop / 0.6) * Math.PI);
      y += b * 0.25;
      sy *= 1 + b * 0.05;
    }
    body.position.y = y;
    body.scale.set(sx, sy, sx);
    body.rotation.z = p.sway ? Math.sin(t * 3) * 0.06 : 0;

    // Bras (coucou animé)
    const wave = p.wave ? Math.sin(t * 9) * 0.32 : 0;
    const cheer = p.jump ? Math.sin(t * 12) * 0.12 : 0;
    arms.L.rotation.set(state.armL[1], 0, state.armL[0] - cheer);
    arms.R.rotation.set(state.armR[1], 0, state.armR[0] + wave + cheer);

    // Tête : inclinaison, regard vers le pointeur, hochement
    head.rotation.z = state.tilt + Math.sin(t * 1.3) * 0.04 + (p.sway ? Math.sin(t * 3 + 0.5) * 0.08 : 0);
    head.rotation.y = state.look[0] * 0.45;
    head.rotation.x = state.look[1] * 0.25 + (p.nod ? 0.18 + Math.sin(t * 1.3) * 0.05 : 0);

    // Clignement des yeux
    if (t > state.blinkAt) state.blinkAt = t + 2.5 + ((t * 7.13) % 2.5);
    const blink = state.blinkAt - t < 0.12 ? 0.12 : 1;
    eyes.open.scale.y = blink;

    // Effets
    const ex = extras[p.extra];
    if (ex?.visible) {
      if (p.extra === 'sparkles') {
        ex.children.forEach((s, i) => {
          const a = t * 0.9 + (i / 6) * Math.PI * 2;
          s.position.set(Math.cos(a) * 1.35, 1.6 + Math.sin(a * 1.7) * 0.6, Math.sin(a) * 0.6 + 0.3);
          s.rotation.set(t * 2, t * 3, 0);
          s.scale.setScalar(0.6 + 0.5 * Math.abs(Math.sin(t * 4 + i)));
        });
      } else if (p.extra === 'thought') {
        ex.children.forEach((s, i) => (s.position.y = 2.35 + i * 0.25 + Math.sin(t * 2 + i) * 0.04));
      } else {
        ex.children.forEach((s) => {
          const ph = (t * 0.45 + s.userData.phase) % 1;
          const side = p.extra === 'hearts' ? -0.2 : 0.85;
          s.position.set(side + ph * 0.5, 2.3 + ph * 0.9, 0.3);
          const sc = (p.extra === 'hearts' ? 0.16 : 0.32) * Math.sin(ph * Math.PI);
          s.scale.setScalar(Math.max(0.001, sc));
          if (s.material?.opacity !== undefined && s.isSprite) s.material.opacity = Math.sin(ph * Math.PI);
          if (p.extra === 'hearts') s.rotation.y = t * 2;
        });
      }
    }
  }

  return {
    object: root,
    setMood,
    setOutfit: dress,
    update,
    look(x, y) {
      state.lookTarget = [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
    },
    boop() {
      state.boop = 0.6;
    },
    get mood() {
      return state.mood;
    },
  };
}

export function enableShadows(object) {
  object.traverse((o) => {
    if (o.isMesh && o.castShadow === undefined) o.castShadow = true;
  });
}

export { M as materials, G as geometries, mesh, DoubleSide };

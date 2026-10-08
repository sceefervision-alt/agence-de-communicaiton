// Le jardin de Bao en 3D : une petite île flottante façon diorama.
// Le nombre de bambous suit les éléments ancrés en mémoire, le ciel passe de
// l'aube à la nuit étoilée avec le niveau, et les décorations achetées dans
// la boutique s'y installent.

import { THREE, environment } from './engine.js';
import { createBao, materials as M, geometries as G, mesh } from './bao3d.js';
import { toon, addOutlines } from './toon.js';

const { Group, Scene, PerspectiveCamera, Color, Fog, CanvasTexture, SRGBColorSpace, CylinderGeometry, ConeGeometry, LatheGeometry, Vector2, TorusGeometry, HemisphereLight, DirectionalLight, PointLight, Points, BufferGeometry, Float32BufferAttribute, PointsMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, DoubleSide } = THREE;

// Ciel, lumière et ambiance par niveau (A1 aube → C2 nuit étoilée).
export const SKIES = [
  { top: '#9cc2ff', bottom: '#ffe3d3', sun: 0xfff1dd, sunI: 2.2, hemi: [0xdbe8ff, 0xd8e8c8, 1.2], night: false },
  { top: '#79aaf6', bottom: '#eaf3ff', sun: 0xffffff, sunI: 2.5, hemi: [0xe4efff, 0xd8e8c8, 1.25], night: false },
  { top: '#4d8cf0', bottom: '#d9ebff', sun: 0xffffff, sunI: 2.6, hemi: [0xe4efff, 0xd8e8c8, 1.3], night: false },
  { top: '#4a74d6', bottom: '#ffdcae', sun: 0xffd9a0, sunI: 2.3, hemi: [0xffe9cc, 0xd8d0b0, 1.1], night: false },
  { top: '#22357a', bottom: '#f2a07a', sun: 0xffb087, sunI: 1.5, hemi: [0x8090d0, 0x6a5a70, 0.9], night: false, dusk: true },
  { top: '#050c20', bottom: '#1d3a78', sun: 0xaabfff, sunI: 0.7, hemi: [0x4a5ea0, 0x1a2238, 0.7], night: true },
];

function gradientTexture(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

// Générateur pseudo-aléatoire déterministe : le jardin ne « saute » pas d'un rendu à l'autre.
function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const grass = () => toon(0x6fd36b);
const soil = () => toon(0xc98f5e);

function bambooStalk(height, r) {
  const g = new Group();
  const segH = 0.42;
  const n = Math.max(2, Math.round(height / segH));
  const stalkMat = M.color(0x58c06a);
  const nodeMat = M.color(0x3f9a58, { roughness: 0.5 });
  const leafMat = M.color(0x8ee07a, { side: DoubleSide });
  for (let i = 0; i < n; i++) {
    g.add(mesh(new CylinderGeometry(0.07, 0.075, segH - 0.02, 14), stalkMat, { p: [0, i * segH + segH / 2, 0] }));
    g.add(mesh(new TorusGeometry(0.075, 0.018, 8, 18), nodeMat, { p: [0, (i + 1) * segH, 0], r: [Math.PI / 2, 0, 0], shadow: false }));
    if (i > 1 && r() < 0.55) {
      const side = r() < 0.5 ? -1 : 1;
      g.add(mesh(G.sphere(), leafMat, { p: [side * 0.24, (i + 1) * segH, 0.02], s: [0.24, 0.03, 0.08], r: [0, r() * 0.6, side * -0.35] }));
    }
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + r();
    g.add(mesh(G.sphere(), leafMat, { p: [Math.cos(a) * 0.22, n * segH + 0.05, Math.sin(a) * 0.22], s: [0.26, 0.03, 0.09], r: [0, -a, 0.35] }));
  }
  return addOutlines(g, { thickness: 0.025, minSize: 0.08 });
}

function cherryTree() {
  const g = new Group();
  const bark = M.color(0x8a5a3c, { roughness: 0.8, clearcoat: 0 });
  g.add(mesh(new CylinderGeometry(0.11, 0.16, 1.3, 12), bark, { p: [0, 0.65, 0], r: [0, 0, 0.08] }));
  g.add(mesh(new CylinderGeometry(0.06, 0.09, 0.7, 10), bark, { p: [0.25, 1.35, 0], r: [0, 0, -0.7] }));
  const blossom = [0xffc2d4, 0xffd3e0, 0xffb3c7, 0xffe0ea];
  const pts = [[0, 1.9, 0, 0.62], [0.55, 1.75, 0.1, 0.45], [-0.5, 1.7, 0.05, 0.42], [0.2, 2.25, -0.1, 0.42], [-0.25, 2.15, 0.2, 0.38], [0.35, 1.55, 0.35, 0.32], [-0.3, 1.5, -0.3, 0.32]];
  pts.forEach(([x, y, z, s], i) => g.add(mesh(G.sphere(), M.color(blossom[i % 4]), { p: [x, y, z], s })));
  return addOutlines(g, { thickness: 0.03 });
}

function lantern() {
  const g = new Group();
  g.add(mesh(new CylinderGeometry(0.03, 0.03, 1.1, 8), M.color(0x5b4636), { p: [0, 0.55, 0] }));
  g.add(mesh(new CylinderGeometry(0.18, 0.02, 0.05, 8), M.color(0x5b4636), { p: [0.2, 1.1, 0], r: [0, 0, Math.PI / 2] }));
  const paper = mesh(G.sphere(), M.glow(0xff7a6e), { p: [0.38, 0.88, 0], s: [0.2, 0.26, 0.2] });
  g.add(paper);
  g.add(mesh(new CylinderGeometry(0.1, 0.1, 0.04, 16), M.color(0x2b2b2b), { p: [0.38, 1.15, 0] }));
  g.add(mesh(new CylinderGeometry(0.1, 0.1, 0.04, 16), M.color(0x2b2b2b), { p: [0.38, 0.61, 0] }));
  g.userData.paper = paper;
  paper.userData.noOutline = true;
  return addOutlines(g, { thickness: 0.02 });
}

function pond() {
  const g = new Group();
  g.add(mesh(new CylinderGeometry(0.95, 0.95, 0.04, 40), toon(0x5ab8f5), { p: [0, 0.02, 0], s: [1, 1, 0.65], shadow: false }));
  g.add(mesh(new TorusGeometry(0.95, 0.07, 10, 40), M.color(0xb9c3cf, { roughness: 0.8 }), { p: [0, 0.03, 0], s: [1, 0.65, 1], r: [Math.PI / 2, 0, 0] }));
  g.add(mesh(new CylinderGeometry(0.16, 0.16, 0.02, 20), M.color(0x5fbf6f), { p: [-0.35, 0.05, 0.1] }));
  g.add(mesh(G.sphereLo(), M.color(0xffa6c9), { p: [-0.35, 0.09, 0.1], s: [0.06, 0.05, 0.06] }));
  return g;
}

// Pont en arc (style jardin japonais) : deux rambardes et un tablier de planches.
function bridge() {
  const g = new Group();
  const red = M.color(0xd2414f, { clearcoat: 0.8, roughness: 0.3 });
  const wood = M.color(0xb98a5e, { roughness: 0.7, clearcoat: 0.2 });
  const R = 1.0;
  const rise = 0.42;
  for (const z of [-0.26, 0.26]) g.add(mesh(new TorusGeometry(R, 0.035, 10, 40, Math.PI), red, { p: [0, 0.16, z], s: [1, rise, 1] }));
  for (let i = 1; i < 14; i++) {
    const a = (i / 14) * Math.PI;
    g.add(mesh(new THREE.BoxGeometry(0.15, 0.04, 0.5), wood, { p: [Math.cos(a) * R, Math.sin(a) * R * rise + 0.04, 0], r: [0, 0, Math.atan2(Math.cos(a) * rise, -Math.sin(a))] }));
  }
  for (const x of [-0.98, 0.98]) for (const z of [-0.26, 0.26]) g.add(mesh(new CylinderGeometry(0.035, 0.035, 0.25, 8), red, { p: [x, 0.12, z] }));
  return addOutlines(g, { thickness: 0.02 });
}

function cloud(r) {
  const g = new Group();
  const mat = M.color(0xffffff);
  for (let i = 0; i < 5; i++) {
    const c = mesh(G.sphereLo(), mat, { p: [i * 0.45 - 0.9, (i % 2) * 0.15, r() * 0.2], s: 0.35 + r() * 0.25, shadow: false });
    c.userData.noOutline = false;
    g.add(c);
  }
  return addOutlines(g, { thickness: 0.05, color: 0x9fb7e8 });
}

export function createGarden({ stalks = 3, level = 0, decor = [], mood = 'happy', stage = 0, equipped = {} } = {}) {
  const sky = SKIES[Math.max(0, Math.min(5, level))];
  const r = rand(42);
  const scene = new Scene();
  scene.background = gradientTexture(sky.top, sky.bottom);
  scene.fog = new Fog(new Color(sky.bottom), 12, 28);
  scene.environment = environment();
  scene.environmentIntensity = sky.night ? 0.25 : 0.5;

  scene.add(new HemisphereLight(...sky.hemi));
  const sun = new DirectionalLight(sky.sun, sky.sunI);
  sun.position.set(4, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 });
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  const world = new Group();
  scene.add(world);

  // Île : dessus herbeux + dessous en terre arrondi
  const top = mesh(new CylinderGeometry(3.3, 3.45, 0.28, 72), grass(), { p: [0, -0.14, 0] });
  top.receiveShadow = true;
  world.add(addOutlines(top, { thickness: 0.04 }));
  const profile = [new Vector2(0, -1.25), new Vector2(1.6, -1.1), new Vector2(2.8, -0.75), new Vector2(3.4, -0.35), new Vector2(3.45, -0.28)];
  const under = mesh(new LatheGeometry(profile, 72), soil(), { shadow: false });
  under.userData.noOutline = false;
  world.add(addOutlines(under, { thickness: 0.04 }));
  for (let i = 0; i < 6; i++) world.add(mesh(G.sphereLo(), M.color(0xb5b9c4, { roughness: 0.9 }), { p: [Math.cos(i * 1.7) * 2.6, -0.02, Math.sin(i * 1.7) * 2.2], s: [0.22, 0.12, 0.18] }));

  // Herbes et fleurs
  const tuftMat = M.color(0x47a964, { roughness: 0.8, clearcoat: 0 });
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2;
    const d = 0.6 + r() * 2.5;
    world.add(mesh(new ConeGeometry(0.045, 0.22, 5), tuftMat, { p: [Math.cos(a) * d, 0.1, Math.sin(a) * d * 0.9], r: [0, 0, (r() - 0.5) * 0.4], shadow: false }));
  }
  const petals = [0xff8aa5, 0xffd166, 0xffffff, 0xc9a7f5, 0x9ad0f5];
  for (let i = 0; i < 22; i++) {
    const a = r() * Math.PI * 2;
    const d = 1 + r() * 2.2;
    world.add(mesh(G.sphereLo(), M.color(petals[i % petals.length], { roughness: 0.6 }), { p: [Math.cos(a) * d, 0.07, Math.sin(a) * d * 0.9], s: 0.06, shadow: false }));
  }
  // Chemin de pierres jusqu'à Bao
  for (let i = 0; i < 4; i++) world.add(mesh(new CylinderGeometry(0.22, 0.24, 0.05, 18), M.color(0xe6e1d8, { roughness: 0.9 }), { p: [0.15 * (i % 2 ? 1 : -1), 0.02, 2.95 - i * 0.48], s: [1, 1, 0.75] }));

  // Bambous (derrière et sur les côtés, jamais devant Bao)
  const bamboos = [];
  const n = Math.max(1, Math.min(30, stalks));
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (1.05 + (i / Math.max(1, n - 1)) * 0.9) + (r() - 0.5) * 0.25;
    const d = 1.7 + r() * 1.25;
    const h = 1.4 + r() * 1.9;
    const s = bambooStalk(h, r);
    s.position.set(Math.cos(a) * d, 0, Math.sin(a) * d * 0.95);
    s.rotation.set((r() - 0.5) * 0.1, r() * Math.PI, (r() - 0.5) * 0.12);
    s.userData.phase = r() * Math.PI * 2;
    world.add(s);
    bamboos.push(s);
  }

  // Décorations de la boutique
  const glows = [];
  if (decor.includes('cherry')) {
    const t = cherryTree();
    t.position.set(2.15, 0, -0.4);
    world.add(t);
  }
  if (decor.includes('pond')) {
    const p = pond();
    p.position.set(-1.6, 0, 1.35);
    world.add(p);
    if (decor.includes('bridge')) {
      const b = bridge();
      b.position.set(-1.6, 0.02, 1.35);
      world.add(b);
    }
  } else if (decor.includes('bridge')) {
    const b = bridge();
    b.position.set(-1.7, 0, 1.2);
    world.add(b);
  }
  if (decor.includes('lantern')) {
    for (const [x, z] of [[1.65, 1.5], [-2.4, -0.2]]) {
      const l = lantern();
      l.position.set(x, 0, z);
      world.add(l);
      if (sky.night || sky.dusk) {
        const light = new PointLight(0xff9a7a, 2.5, 3.5, 2);
        light.position.set(x + 0.38, 0.9, z);
        world.add(light);
        glows.push(light);
      }
    }
  }
  const fireflies = new Group();
  if (decor.includes('fireflies') || sky.night) {
    for (let i = 0; i < (decor.includes('fireflies') ? 14 : 5); i++) {
      const f = mesh(G.sphereLo(), M.glow(0xffe680), { s: 0.035, shadow: false });
      f.userData = { a: r() * Math.PI * 2, d: 0.8 + r() * 2.4, y: 0.4 + r() * 1.4, sp: 0.2 + r() * 0.4 };
      fireflies.add(f);
    }
    world.add(fireflies);
  }

  // Ciel : nuages le jour, étoiles et lune la nuit
  const sky3d = new Group();
  scene.add(sky3d);
  if (sky.night) {
    const pos = [];
    for (let i = 0; i < 260; i++) pos.push((r() - 0.5) * 40, 2 + r() * 14, -10 - r() * 8);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    sky3d.add(new Points(geo, new PointsMaterial({ color: 0xffffff, size: 0.08, sizeAttenuation: true, fog: false })));
    sky3d.add(mesh(G.sphere(), new MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff3c4, emissiveIntensity: 1.2, fog: false }), { p: [5.5, 6.5, -12], s: 0.7, shadow: false }));
  } else {
    sky3d.add(mesh(G.sphere(), new MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffd987, emissiveIntensity: sky.dusk ? 1.6 : 1.2, fog: false }), { p: [6, sky.dusk ? 2.5 : 6, -14], s: 0.9, shadow: false }));
    for (let i = 0; i < 3; i++) {
      const c = cloud(r);
      c.position.set(-7 + i * 6, 4.5 + r() * 2, -9 - r() * 3);
      c.userData.speed = 0.08 + r() * 0.08;
      sky3d.add(c);
    }
  }

  // Bao, assis devant les bambous
  const bao = createBao({ mood, stage, equipped });
  bao.object.scale.setScalar(0.62);
  bao.object.position.set(0.2, 0, 1.1);
  bao.object.rotation.y = -0.25;
  world.add(bao.object);

  const camera = new PerspectiveCamera(32, 2, 0.1, 60);

  function update(t, dt) {
    camera.position.set(Math.sin(t * 0.12) * 0.9, 2.5, 8.6);
    camera.lookAt(0, 0.95, 0);
    world.position.y = Math.sin(t * 0.8) * 0.04;
    bamboos.forEach((s) => (s.rotation.z = Math.sin(t * 0.9 + s.userData.phase) * 0.035));
    sky3d.children.forEach((c) => {
      if (c.userData.speed) c.position.x = ((c.position.x + 7 + c.userData.speed * dt * 10) % 16) - 7;
    });
    fireflies.children.forEach((f) => {
      const u = f.userData;
      u.a += dt * u.sp;
      f.position.set(Math.cos(u.a) * u.d, u.y + Math.sin(t * 2 + u.d) * 0.15, Math.sin(u.a) * u.d * 0.8);
      f.scale.setScalar(0.03 + 0.02 * Math.abs(Math.sin(t * 3 + u.d)));
    });
    glows.forEach((l, i) => (l.intensity = 2.2 + Math.sin(t * 4 + i) * 0.4));
    bao.update(t, dt);
  }

  return { scene, camera, update, bao, bamboos };
}

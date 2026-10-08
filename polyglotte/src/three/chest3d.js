// Coffres et cadeaux en 3D. Au repos ils flottent et scintillent ; à
// l'ouverture : anticipation (le coffre tremble), le couvercle s'ouvre avec
// un rebond, un rayon de lumière jaillit et une gerbe de feuilles de bambou,
// de pièces et d'étoiles s'envole.

import { THREE } from './engine.js';
import { materials as M, geometries as G, mesh } from './bao3d.js';
import { addOutlines } from './toon.js';

const { Group, RoundedBoxGeometry, CylinderGeometry, ConeGeometry, TorusGeometry, OctahedronGeometry, MeshStandardMaterial, MeshBasicMaterial, PointLight, AdditiveBlending, DoubleSide } = THREE;

const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};

function buildChest() {
  const g = new Group();
  const wood = M.color(0xd98a45);
  const woodDark = M.color(0xa65f2c);
  const gold = M.gold();
  g.add(mesh(new RoundedBoxGeometry(1.5, 0.85, 1.0, 4, 0.1), wood, { p: [0, 0.425, 0] }));
  for (const x of [-0.5, 0.5]) g.add(mesh(new RoundedBoxGeometry(0.14, 0.87, 1.03, 2, 0.04), gold, { p: [x, 0.425, 0] }));
  g.add(mesh(new RoundedBoxGeometry(1.53, 0.1, 1.03, 2, 0.04), woodDark, { p: [0, 0.06, 0] }));
  g.add(mesh(new RoundedBoxGeometry(0.26, 0.3, 0.08, 3, 0.04), gold, { p: [0, 0.7, 0.52] }));
  g.add(mesh(G.sphereLo(), M.glossBlack(), { p: [0, 0.71, 0.565], s: [0.035, 0.05, 0.02] }));
  // Couvercle bombé, pivot sur l'arête arrière
  const lid = new Group();
  lid.position.set(0, 0.85, -0.5);
  const dome = mesh(new CylinderGeometry(0.5, 0.5, 1.5, 40, 1, false, 0, Math.PI), M.color(0xd98a45, { side: DoubleSide }), { p: [0, 0, 0.5], r: [0, 0, Math.PI / 2] });
  // Fonds latéraux du couvercle
  for (const x of [-0.75, 0.75]) lid.add(mesh(new CylinderGeometry(0.5, 0.5, 0.02, 40, 1, false, 0, Math.PI), woodDark, { p: [x, 0, 0.5], r: [0, 0, Math.PI / 2] }));
  lid.add(dome);
  for (const x of [-0.5, 0.5]) {
    const band = mesh(new TorusGeometry(0.505, 0.07, 10, 40, Math.PI), gold, { p: [x, 0, 0.5], r: [0, Math.PI / 2, 0] });
    lid.add(band);
  }
  g.add(lid);
  // Lueur intérieure
  const glow = mesh(new RoundedBoxGeometry(1.3, 0.1, 0.8, 2, 0.04), M.glow(0xffd56b), { p: [0, 0.82, 0], shadow: false });
  g.add(glow);
  return { group: g, lid, glow, openAngle: -1.95, lidHeight: 0.85 };
}

function buildGift(color = 0x8fb0ff, ribbon = 0xffffff) {
  const g = new Group();
  const box = M.color(color);
  const rib = M.color(ribbon);
  g.add(mesh(new RoundedBoxGeometry(1.0, 0.8, 1.0, 4, 0.06), box, { p: [0, 0.4, 0] }));
  g.add(mesh(new RoundedBoxGeometry(0.18, 0.82, 1.02, 2, 0.03), rib, { p: [0, 0.4, 0] }));
  g.add(mesh(new RoundedBoxGeometry(1.02, 0.82, 0.18, 2, 0.03), rib, { p: [0, 0.4, 0] }));
  const lid = new Group();
  lid.position.set(0, 0.8, 0);
  lid.add(mesh(new RoundedBoxGeometry(1.1, 0.22, 1.1, 4, 0.06), box, { p: [0, 0.1, 0] }));
  lid.add(mesh(new RoundedBoxGeometry(0.18, 0.24, 1.12, 2, 0.03), rib, { p: [0, 0.1, 0] }));
  lid.add(mesh(new RoundedBoxGeometry(1.12, 0.24, 0.18, 2, 0.03), rib, { p: [0, 0.1, 0] }));
  for (const s of [-1, 1]) lid.add(mesh(new TorusGeometry(0.17, 0.06, 12, 28), rib, { p: [s * 0.17, 0.32, 0], r: [0, 0, s * 0.5], s: [1, 0.75, 1] }));
  lid.add(mesh(G.sphere(), rib, { p: [0, 0.27, 0], s: 0.08 }));
  g.add(lid);
  const glow = mesh(new RoundedBoxGeometry(0.85, 0.06, 0.85, 2, 0.03), M.glow(0xfff1b8), { p: [0, 0.79, 0], shadow: false });
  g.add(glow);
  return { group: g, lid, glow, lidHeight: 0.8 };
}

export function createChest({ kind = 'chest', color, ribbon } = {}) {
  const parts = kind === 'gift' ? buildGift(color, ribbon) : buildChest();
  parts.glow.userData.noOutline = true;
  addOutlines(parts.group, { thickness: 0.03 });
  const root = new Group();
  root.add(parts.group);
  parts.glow.visible = false;

  const light = new PointLight(0xffd27a, 0, 6, 1.6);
  light.position.set(0, 1.3, 0.3);
  root.add(light);

  // Rayons de lumière
  const rays = new Group();
  rays.position.y = parts.lidHeight;
  const rayMat = new MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide });
  for (let i = 0; i < 7; i++) {
    const ray = new THREE.Mesh(new ConeGeometry(0.22, 2.4, 12, 1, true), rayMat);
    ray.position.y = 1.2;
    ray.rotation.x = Math.PI; // étroit en bas, large en haut
    const pivot = new Group();
    pivot.rotation.set((i - 3) * 0.13, 0, (i - 3) * 0.22);
    pivot.add(ray);
    rays.add(pivot);
  }
  root.add(rays);

  // Particules de l'explosion
  const burst = new Group();
  root.add(burst);
  const particles = [];
  const leafMat = M.color(0x6cc98b, { roughness: 0.5 });
  const coinMat = M.gold();
  const starMat = M.glow(0xffd56b);
  for (let i = 0; i < 34; i++) {
    const type = i % 3;
    const p =
      type === 0
        ? mesh(G.sphere(), leafMat, { s: [0.13, 0.025, 0.05], shadow: false })
        : type === 1
          ? mesh(new CylinderGeometry(0.08, 0.08, 0.025, 20), coinMat, { shadow: false })
          : mesh(new OctahedronGeometry(0.07, 0), starMat, { shadow: false });
    p.visible = false;
    burst.add(p);
    particles.push({ m: p, v: new THREE.Vector3(), spin: new THREE.Vector3() });
  }

  // Petites étincelles au repos
  const twinkles = new Group();
  for (let i = 0; i < 5; i++) twinkles.add(mesh(new OctahedronGeometry(0.05, 0), starMat, { shadow: false }));
  root.add(twinkles);

  const state = { phase: 'idle', t0: 0, now: 0 };

  function open() {
    if (state.phase !== 'idle') return;
    state.phase = 'shake';
    state.t0 = state.now;
  }

  function launch() {
    parts.glow.visible = true;
    particles.forEach((p, i) => {
      p.m.visible = true;
      p.m.position.set((Math.random() - 0.5) * 0.4, parts.lidHeight + 0.1, (Math.random() - 0.5) * 0.3);
      const a = Math.random() * Math.PI * 2;
      const sp = 1.2 + Math.random() * 1.6;
      p.v.set(Math.cos(a) * sp * 0.6, 3.2 + Math.random() * 2.2, Math.sin(a) * sp * 0.4 + 0.5);
      p.spin.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      p.delay = i * 0.012;
    });
  }

  function update(t, dt) {
    state.now = t;
    const since = t - state.t0;
    let y = Math.sin(t * 2) * 0.06;
    let rz = Math.sin(t * 1.4) * 0.03;
    let sc = 1;
    if (state.phase === 'shake') {
      const k = Math.min(1, since / 0.7);
      rz = Math.sin(since * 40) * 0.08 * k;
      sc = 1 + Math.sin(since * 30) * 0.02 * k;
      if (since > 0.7) {
        state.phase = 'opening';
        state.t0 = t;
        launch();
      }
    }
    if (state.phase === 'opening' || state.phase === 'open') {
      const k = Math.min(1, (t - state.t0) / 0.6);
      if (kind === 'gift') {
        parts.lid.position.y = parts.lidHeight + easeOutBack(k) * 1.6;
        parts.lid.rotation.set(-0.4 * k, k * 2.5, 0.3 * k);
      } else {
        parts.lid.rotation.x = parts.openAngle * easeOutBack(k);
      }
      light.intensity = 2.4 * k + Math.sin(t * 6) * 0.3;
      rayMat.opacity = 0.16 * k;
      rays.rotation.y = t * 0.6;
      rays.scale.setScalar(0.6 + 0.4 * k);
      if (k >= 1) state.phase = 'open';
      particles.forEach((p) => {
        if (!p.m.visible) return;
        if ((p.delay -= dt) > 0) return;
        p.v.y -= 6.5 * dt;
        p.m.position.addScaledVector(p.v, dt);
        p.m.rotation.x += p.spin.x * dt;
        p.m.rotation.y += p.spin.y * dt;
        if (p.m.position.y < -0.2) p.m.visible = false;
      });
      y = 0;
      rz = 0;
    }
    parts.group.position.y = y;
    parts.group.rotation.z = rz;
    parts.group.scale.setScalar(sc);
    twinkles.visible = state.phase === 'idle' || state.phase === 'shake';
    twinkles.children.forEach((s, i) => {
      const a = t * 0.8 + (i / 5) * Math.PI * 2;
      s.position.set(Math.cos(a) * 1.1, 0.9 + Math.sin(t * 2 + i) * 0.35, Math.sin(a) * 0.7);
      s.scale.setScalar(0.5 + 0.6 * Math.abs(Math.sin(t * 3 + i)));
      s.rotation.set(t, t * 1.3, 0);
    });
  }

  return { object: root, update, open, get phase() {
    return state.phase;
  } };
}

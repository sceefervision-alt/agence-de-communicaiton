// Moteur 3D partagé. Un seul contexte WebGL dessine toutes les scènes de
// l'application (Bao, jardin, coffres…), puis chaque image est recopiée dans
// le <canvas> 2D de sa vue. On évite ainsi la limite du nombre de contextes
// WebGL et on économise la batterie sur mobile. Les petites vignettes sont
// rendues une seule fois puis mises en cache sous forme d'images.

import * as THREE from '../../vendor/three.js';

export { THREE };

let renderer = null;
let glCanvas = null;
let envMap = null;
let failed = false;
const views = new Set();
let raf = 0;
let last = 0;

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

export function getRenderer() {
  if (renderer || failed) return renderer;
  try {
    glCanvas = document.createElement('canvas');
    glCanvas.width = glCanvas.height = 2;
    renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 0);
    const pmrem = new THREE.PMREMGenerator(renderer);
    envMap = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  } catch (err) {
    console.warn('3D indisponible :', err);
    failed = true;
    renderer = null;
  }
  return renderer;
}

export const environment = () => envMap;
export const is3DAvailable = () => !!getRenderer();

// Dessine une scène dans un rectangle w × h (pixels physiques) du canvas WebGL.
function drawScene(scene, camera, w, h) {
  const r = getRenderer();
  if (glCanvas.width < w || glCanvas.height < h) {
    r.setSize(Math.max(glCanvas.width, w), Math.max(glCanvas.height, h), false);
  }
  const H = glCanvas.height;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  r.setViewport(0, H - h, w, h);
  r.setScissor(0, H - h, w, h);
  r.setScissorTest(true);
  r.clear();
  r.render(scene, camera);
  r.setScissorTest(false);
}

function blit(view) {
  const { canvas, ctx, w, h } = view;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(glCanvas, 0, 0, w, h, 0, 0, w, h);
}

// Vue animée (ou statique) attachée à un conteneur HTML.
export function createView(container, { scene, camera, update = null, live = true, onPointer = null, onTap = null }) {
  if (!getRenderer()) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'view3d';
  container.append(canvas);
  const view = {
    canvas,
    ctx: canvas.getContext('2d'),
    scene,
    camera,
    update,
    live: live && !reducedMotion(),
    visible: true,
    dirty: true,
    w: 0,
    h: 0,
    t: 0,
    destroy() {
      views.delete(view);
      io.disconnect();
      ro.disconnect();
      canvas.remove();
    },
  };
  const measure = () => {
    const rect = container.getBoundingClientRect();
    view.w = Math.max(1, Math.round(rect.width * dpr()));
    view.h = Math.max(1, Math.round(rect.height * dpr()));
    view.dirty = true;
  };
  const ro = new ResizeObserver(measure);
  ro.observe(container);
  const io = new IntersectionObserver(([e]) => {
    view.visible = e.isIntersecting;
  });
  io.observe(container);
  measure();
  if (onPointer) {
    container.addEventListener('pointermove', (e) => {
      const rect = container.getBoundingClientRect();
      onPointer(((e.clientX - rect.left) / rect.width) * 2 - 1, ((e.clientY - rect.top) / rect.height) * 2 - 1);
    });
    container.addEventListener('pointerleave', () => onPointer(0, 0));
  }
  if (onTap) container.addEventListener('click', onTap);
  views.add(view);
  // Première image immédiate (pas de cadre vide).
  if (update) update(0, 0);
  drawScene(scene, camera, view.w, view.h);
  blit(view);
  view.dirty = false;
  start();
  return view;
}

export function invalidate(view) {
  if (view) view.dirty = true;
}

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
  last = now;
  if (document.hidden) return;
  for (const view of views) {
    if (!view.canvas.isConnected) {
      view.destroy();
      continue;
    }
    if (!view.visible || (!view.live && !view.dirty)) continue;
    view.t += dt;
    if (view.update) view.update(view.t, dt);
    drawScene(view.scene, view.camera, view.w, view.h);
    blit(view);
    view.dirty = false;
  }
  if (!views.size) {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }
}

function start() {
  if (!raf) raf = requestAnimationFrame(frame);
}

// Image figée d'une scène (vignettes, listes) : rendue une fois, mise en cache.
const snapshots = new Map();
export function snapshot(key, build, cssW, cssH) {
  const w = Math.round(cssW * dpr());
  const h = Math.round(cssH * dpr());
  const k = `${key}|${w}x${h}`;
  if (snapshots.has(k)) return snapshots.get(k);
  if (!getRenderer()) return null;
  const { scene, camera, update } = build();
  if (update) update(0.6, 0);
  drawScene(scene, camera, w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(glCanvas, 0, 0, w, h, 0, 0, w, h);
  const url = c.toDataURL('image/png');
  if (snapshots.size > 300) snapshots.clear();
  snapshots.set(k, url);
  return url;
}

// Lumières douces « studio » communes aux scènes de personnages.
export function studioLights(scene, { shadow = true } = {}) {
  scene.environment = environment();
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0xe6ddd0, 1.1));
  const key = new THREE.DirectionalLight(0xfff4e6, 2.1);
  key.position.set(2.5, 5, 4);
  if (shadow) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -2.5;
    key.shadow.camera.right = 2.5;
    key.shadow.camera.top = 3.5;
    key.shadow.camera.bottom = -1;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
  }
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfd4ff, 1.2);
  rim.position.set(-3, 3, -4);
  scene.add(rim);
  return key;
}

// Ombre de contact douce sous les personnages.
export function contactShadow(scene, { size = 4, opacity = 0.18 } = {}) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity }));
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);
  return plane;
}

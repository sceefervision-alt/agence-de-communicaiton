// Rendu « cel-shading » (toon shading) : la 3D dessinée façon dessin animé,
// comme dans les jeux Naruto Storm ou les animations de Duolingo.
// - Ombrage en 3 aplats (lumière, demi-teinte, ombre) au lieu d'un dégradé.
// - Contours noirs obtenus par la technique de la « coque inversée » : une
//   copie légèrement agrandie de chaque forme, dessinée de dos en encre.

import { THREE } from './engine.js';

const { DataTexture, RGBAFormat, NearestFilter, MeshToonMaterial, MeshBasicMaterial, BackSide, Mesh } = THREE;

export const INK = 0x141a2e;

let gradient = null;
export function toonGradient() {
  if (gradient) return gradient;
  // Trois paliers : ombre, demi-teinte, lumière.
  const tones = [165, 232, 255];
  const data = new Uint8Array(tones.length * 4);
  tones.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  gradient = new DataTexture(data, tones.length, 1, RGBAFormat);
  gradient.minFilter = NearestFilter;
  gradient.magFilter = NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

// Matériau dessin animé. Les options « réalistes » (rugosité, vernis…) sont ignorées.
const KEEP = ['side', 'transparent', 'opacity', 'emissive', 'emissiveIntensity', 'depthWrite', 'fog'];
export function toon(color, opts = {}) {
  const params = { color, gradientMap: toonGradient() };
  for (const k of KEEP) if (opts[k] !== undefined) params[k] = opts[k];
  return new MeshToonMaterial(params);
}

const inkCache = new Map();
function inkMaterial(color) {
  if (!inkCache.has(color)) inkCache.set(color, new MeshBasicMaterial({ color, side: BackSide }));
  return inkCache.get(color);
}

// Ajoute un contour encré à toutes les formes d'un objet (épaisseur en unités
// du monde, à peu près constante quelle que soit l'échelle de la forme).
export function addOutlines(root, { thickness = 0.03, color = INK, minSize = 0.03 } = {}) {
  const targets = [];
  root.traverse((o) => {
    if (o.isMesh && !o.userData.noOutline && !o.userData.isOutline && o.material?.type !== 'MeshBasicMaterial' && !o.material?.transparent) targets.push(o);
  });
  for (const m of targets) {
    const geo = m.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const b = geo.boundingBox;
    const half = [(b.max.x - b.min.x) / 2, (b.max.y - b.min.y) / 2, (b.max.z - b.min.z) / 2];
    const world = [Math.abs(m.scale.x) * half[0], Math.abs(m.scale.y) * half[1], Math.abs(m.scale.z) * half[2]];
    if (Math.max(...world) < minSize) continue;
    const ink = new Mesh(geo, inkMaterial(color));
    ink.userData.isOutline = true;
    // Coque agrandie autour du centre de la forme
    const cx = (b.max.x + b.min.x) / 2;
    const cy = (b.max.y + b.min.y) / 2;
    const cz = (b.max.z + b.min.z) / 2;
    const s = world.map((w, i) => 1 + thickness / Math.max(w, 1e-3) / (i === 0 ? 1 : 1));
    ink.scale.set(s[0], s[1], s[2]);
    ink.position.set(cx * (1 - s[0]), cy * (1 - s[1]), cz * (1 - s[2]));
    ink.castShadow = false;
    ink.renderOrder = -1;
    m.add(ink);
  }
  return root;
}

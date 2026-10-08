// Construit la version statique de Polyglotte (dossier dist/), à héberger
// gratuitement sur GitHub Pages, Cloudflare Pages ou tout hébergeur de
// fichiers. Sans serveur, l'application fonctionne avec son contenu intégré :
// leçons écrites à l'avance, conversation scénarisée avec Bao, interface
// traduite. Les fonctions d'IA en direct sont désactivées (aucun appel réseau).
//   node scripts/build-static.mjs

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const entry of ['src', 'vendor', 'icons', 'styles.css', 'sw.js', 'manifest.webmanifest']) {
  await cp(path.join(ROOT, entry), path.join(DIST, entry), { recursive: true });
}

const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const marker = '<script type="module" src="src/main.js"></script>';
if (!html.includes(marker)) throw new Error('index.html : script principal introuvable.');
await writeFile(path.join(DIST, 'index.html'), html.replace(marker, `<script>window.POLYGLOTTE_STATIC = true;</script>\n    ${marker}`));

// GitHub Pages : servir les fichiers tels quels (pas de traitement Jekyll).
await writeFile(path.join(DIST, '.nojekyll'), '');

console.log(`Version statique prête : ${path.relative(process.cwd(), DIST) || '.'}`);

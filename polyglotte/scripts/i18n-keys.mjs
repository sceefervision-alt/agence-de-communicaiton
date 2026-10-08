// Recense toutes les phrases de l'interface à traduire : appels t(), tn() et
// N() dans le code, textes des programmes et des récompenses, attributs
// data-t de index.html. Sert au test de complétude des traductions et à
// préparer i18n/en.js (`node scripts/i18n-keys.mjs` liste les manquantes).

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVELS, TRACKS, SECTORS, GOALS } from '../src/curriculum.js';
import { SHOP, TROPHIES, CHALLENGES } from '../src/rewards.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function files(dir, ext) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(full, ext)));
    else if (ext.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

// Chaînes littérales ('…' ou "…") présentes dans les arguments d'un appel.
function literalsInCall(src, start) {
  const found = [];
  let depth = 1;
  let i = start;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === "'" || c === '"') {
      let j = i + 1;
      let value = '';
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\\') {
          value += src[j + 1];
          j += 2;
        } else value += src[j++];
      }
      // Opérande d'une comparaison (« x === 'garden' ») : pas un texte.
      if (!/[=!]==?\s*$/.test(src.slice(Math.max(0, i - 6), i))) found.push(value);
      i = j + 1;
    } else if (c === '`') {
      // Gabarit : ignoré (les appels imbriqués sont trouvés séparément).
      let j = i + 1;
      let nest = 0;
      while (j < src.length && !(src[j] === '`' && nest === 0)) {
        if (src[j] === '\\') j++;
        else if (src[j] === '$' && src[j + 1] === '{') nest++;
        else if (src[j] === '}' && nest > 0) nest--;
        j++;
      }
      i = j + 1;
    } else {
      if (c === '(') depth++;
      if (c === ')') depth--;
      i++;
    }
  }
  return found;
}

export async function collectKeys() {
  const keys = new Set();
  const sources = [...(await files(path.join(ROOT, 'src'), ['.js'])), ...(await files(path.join(ROOT, 'server'), ['.mjs']))].filter(
    (f) => !f.includes(`${path.sep}i18n${path.sep}`) && !f.includes(`${path.sep}data${path.sep}`) && !f.includes(`${path.sep}three${path.sep}`),
  );
  for (const file of sources) {
    const src = await readFile(file, 'utf8');
    for (const m of src.matchAll(/(?<![\w.$])(t|tn|N)\(/g)) {
      const lits = literalsInCall(src, m.index + m[0].length);
      for (const s of lits) if (/\p{L}/u.test(s) && s.length > 1) keys.add(s);
    }
  }
  for (const l of LEVELS) {
    keys.add(l.name).add(l.tagline);
    for (const u of l.units) keys.add(u.title).add(u.canDo);
  }
  for (const x of [...Object.values(TRACKS), ...SECTORS, ...GOALS, ...SHOP]) keys.add(x.name);
  for (const x of TROPHIES) keys.add(x.name).add(x.desc);
  for (const x of CHALLENGES) keys.add(x.text);
  const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
  for (const m of html.matchAll(/data-t(?:-label)?="([^"]+)"/g)) keys.add(m[1]);
  return keys;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { default: EN } = await import('../src/i18n/en.js');
  const keys = await collectKeys();
  const missing = [...keys].filter((k) => !(k in EN));
  const unused = Object.keys(EN).filter((k) => !keys.has(k));
  if (process.argv.includes('--json')) console.log(JSON.stringify(missing, null, 1));
  else {
    console.log(`${keys.size} phrases, ${missing.length} sans traduction anglaise, ${unused.length} inutilisées.`);
    for (const k of missing) console.log(`  manquante : ${k}`);
    for (const k of unused) console.log(`  inutilisée : ${k}`);
  }
}

// Bao, le panda de Polyglotte. Dessiné en SVG pour rester net à toutes les
// tailles et fonctionner hors ligne. Chaque « humeur » combine une expression
// (yeux, bouche) et un geste (bras, objet tenu) : c'est la communication non
// verbale de l'application. Bao grandit avec l'apprenant : sa tenue évolue
// avec le niveau, et la boutique permet de la personnaliser.

const INK = '#17213a';
const WHITE = '#ffffff';
const BLUSH = '#ffb3c7';
const MOUTH = '#3a1f2b';
const BLUE = '#2a57b8';
const GOLD = '#f2c14e';

export const MOODS = ['happy', 'wave', 'cheer', 'think', 'comfort', 'sleep', 'read', 'listen', 'proud', 'surprise', 'write', 'hello'];

// Tenue par défaut selon le niveau atteint (A1 → C2).
export const STAGES = [
  { head: 'sprout' },
  { head: 'sprout', neck: 'scarf' },
  { neck: 'scarf', eyes: 'round' },
  { head: 'beret', neck: 'scarf', eyes: 'round' },
  { head: 'beret', neck: 'bowtie', eyes: 'round' },
  { head: 'gradcap', neck: 'bowtie', eyes: 'round' },
];

const MOOD_CONFIG = {
  happy: { eyes: 'open', mouth: 'smile', arms: [12, -12] },
  hello: { eyes: 'open', mouth: 'open', arms: [12, -125], wave: true },
  wave: { eyes: 'happy', mouth: 'open', arms: [12, -125], wave: true },
  cheer: { eyes: 'happy', mouth: 'open', arms: [125, -125], jump: true, extra: 'sparkles' },
  think: { eyes: 'up', mouth: 'small', arms: [12, -35], extra: 'thought' },
  comfort: { eyes: 'soft', mouth: 'smile', arms: [-35, 35], hold: 'heart' },
  sleep: { eyes: 'sleep', mouth: 'o', arms: [-25, 25], extra: 'zzz' },
  read: { eyes: 'down', mouth: 'smile', arms: [-40, 40], hold: 'book' },
  listen: { eyes: 'happy', mouth: 'smile', arms: [12, -12], extra: 'notes', phones: true },
  proud: { eyes: 'wink', mouth: 'open', arms: [12, -125], hold: 'medal', extra: 'sparkles' },
  surprise: { eyes: 'big', mouth: 'o', arms: [60, -60] },
  write: { eyes: 'down', mouth: 'small', arms: [-30, 40], hold: 'pencil' },
};

function arm(x, y, angle, cls = '') {
  return `<g class="arm ${cls}" style="transform-origin:${x}px ${y}px"><g transform="rotate(${angle} ${x} ${y})"><rect x="${x - 11}" y="${y - 6}" width="22" height="44" rx="11" fill="${INK}"/></g></g>`;
}

function eye(cx, cy, kind, side) {
  const s = WHITE;
  switch (kind) {
    case 'happy':
      return `<path d="M${cx - 7} ${cy + 2} Q${cx} ${cy - 7} ${cx + 7} ${cy + 2}" stroke="${s}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    case 'soft':
      return `<path d="M${cx - 7} ${cy} Q${cx} ${cy - 5} ${cx + 7} ${cy}" stroke="${s}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'sleep':
      return `<path d="M${cx - 7} ${cy} Q${cx} ${cy + 5} ${cx + 7} ${cy}" stroke="${s}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'wink':
      if (side === 'r') return eye(cx, cy, 'happy');
      return eye(cx, cy, 'open');
    case 'big':
      return `<circle cx="${cx}" cy="${cy}" r="8.5" fill="${s}"/><circle cx="${cx}" cy="${cy + 1}" r="5.5" fill="${INK}"/><circle cx="${cx + 2}" cy="${cy - 2}" r="2" fill="${s}"/>`;
    default: {
      const dx = kind === 'up' ? 1.5 : 0;
      const dy = kind === 'up' ? -2.5 : kind === 'down' ? 2.5 : 1;
      return `<g class="eye"><circle cx="${cx}" cy="${cy}" r="6.5" fill="${s}"/><circle cx="${cx + dx}" cy="${cy + dy}" r="4.2" fill="${INK}"/><circle cx="${cx + dx + 1.6}" cy="${cy + dy - 1.8}" r="1.6" fill="${s}"/></g>`;
    }
  }
}

function mouth(kind) {
  switch (kind) {
    case 'open':
      return `<path d="M90 107 Q100 123 110 107 Z" fill="${MOUTH}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M95 114 Q100 119 105 114" fill="#ff8aa5"/>`;
    case 'o':
      return `<ellipse cx="100" cy="112" rx="4" ry="5" fill="${MOUTH}"/>`;
    case 'small':
      return `<path d="M95 109 Q100 112 105 109" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    default:
      return `<path d="M91 107 Q95.5 113 100 107 Q104.5 113 109 107" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

const HEAD_ITEMS = {
  sprout: `<path d="M100 27 Q97 16 101 8" stroke="#3f9e5f" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="92" cy="12" rx="9" ry="5" fill="#5bbf7a" transform="rotate(-25 92 12)"/><ellipse cx="110" cy="10" rx="9" ry="5" fill="#5bbf7a" transform="rotate(25 110 10)"/>`,
  beret: `<ellipse cx="108" cy="30" rx="38" ry="13" fill="#c23b4a" transform="rotate(-10 108 30)"/><circle cx="110" cy="17" r="3.5" fill="#c23b4a"/>`,
  gradcap: `<rect x="76" y="22" width="48" height="16" rx="3" fill="${INK}"/><path d="M52 24 L100 8 L148 24 L100 40 Z" fill="${INK}"/><path d="M100 24 L138 30 L138 46" stroke="${GOLD}" stroke-width="2.5" fill="none"/><circle cx="138" cy="48" r="4" fill="${GOLD}"/>`,
  crown: `<path d="M70 34 L74 12 L87 26 L100 6 L113 26 L126 12 L130 34 Z" fill="${GOLD}" stroke="#c9952a" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="24" r="3.5" fill="#c23b4a"/>`,
  flowers: `<g>${[[62, 34, '#ff8aa5'], [78, 24, '#ffd166'], [100, 20, '#ff8aa5'], [122, 24, '#9ad0f5'], [138, 34, '#ffd166']]
    .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/><circle cx="${x}" cy="${y}" r="3" fill="${WHITE}"/>`)
    .join('')}</g>`,
  cap: `<path d="M58 40 Q100 -2 142 40 Z" fill="${BLUE}"/><path d="M96 38 Q132 30 162 42 Q130 48 96 44 Z" fill="${INK}"/><circle cx="100" cy="16" r="3" fill="${INK}"/>`,
  beanie: `<path d="M56 44 Q100 -6 144 44 Z" fill="#e85d75"/><rect x="54" y="38" width="92" height="12" rx="6" fill="#f7d6dd"/><circle cx="100" cy="10" r="9" fill="#f7d6dd"/>`,
  straw: `<ellipse cx="100" cy="36" rx="62" ry="12" fill="#e8c77a"/><path d="M70 36 Q72 10 100 10 Q128 10 130 36 Z" fill="#f0d58f"/><rect x="71" y="27" width="58" height="7" fill="${BLUE}"/>`,
};

const EYE_ITEMS = {
  round: `<g fill="none" stroke="${GOLD}" stroke-width="3"><circle cx="75" cy="84" r="15"/><circle cx="125" cy="84" r="15"/><path d="M90 84 Q100 78 110 84"/></g>`,
  sun: `<g><rect x="58" y="74" width="34" height="20" rx="9" fill="${INK}" stroke="#4a5875" stroke-width="2"/><rect x="108" y="74" width="34" height="20" rx="9" fill="${INK}" stroke="#4a5875" stroke-width="2"/><path d="M92 82 L108 82" stroke="#4a5875" stroke-width="3"/><path d="M64 79 L72 79" stroke="${WHITE}" stroke-width="2" opacity=".6" stroke-linecap="round"/></g>`,
};

const NECK_ITEMS = {
  scarf: (c = BLUE) => `<path d="M60 128 Q100 150 140 128 L141 141 Q100 164 59 141 Z" fill="${c}"/><rect x="112" y="140" width="13" height="28" rx="5" fill="${c}" transform="rotate(-12 118 140)"/>`,
  redscarf: () => NECK_ITEMS.scarf('#c23b4a'),
  bowtie: (c = BLUE) => `<path d="M100 138 L82 128 L82 150 Z M100 138 L118 128 L118 150 Z" fill="${c}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="100" cy="139" r="5" fill="${GOLD}"/>`,
  goldbow: () => NECK_ITEMS.bowtie(GOLD),
  lei: () => `<g>${[64, 76, 88, 100, 112, 124, 136]
    .map((x, i) => `<circle cx="${x}" cy="${136 + Math.round(Math.sin((i / 6) * Math.PI) * 10)}" r="6.5" fill="${['#ff8aa5', '#ffd166', '#9ad0f5'][i % 3]}"/>`)
    .join('')}</g>`,
};

const HOLD = {
  book: `<g><rect x="72" y="134" width="56" height="36" rx="4" fill="${BLUE}"/><rect x="76" y="137" width="48" height="30" rx="2" fill="${WHITE}"/><path d="M100 137 L100 167" stroke="${BLUE}" stroke-width="2"/><path d="M81 145 H95 M81 151 H95 M105 145 H119 M105 151 H119" stroke="#c9d4e8" stroke-width="2"/></g>`,
  heart: `<path d="M100 172 C70 152 76 128 92 132 C97 133 100 138 100 140 C100 138 103 133 108 132 C124 128 130 152 100 172 Z" fill="#e85d75" stroke="${INK}" stroke-width="2"/>`,
  pencil: `<g transform="rotate(-35 118 150)"><rect x="110" y="128" width="12" height="40" rx="2" fill="${GOLD}"/><path d="M110 168 L116 180 L122 168 Z" fill="#f4d9b0"/><rect x="110" y="124" width="12" height="7" fill="#e85d75"/></g><rect x="66" y="156" width="44" height="22" rx="3" fill="${WHITE}" stroke="#c9d4e8" stroke-width="2"/>`,
  medal: `<path d="M92 120 L100 140 L108 120" stroke="${BLUE}" stroke-width="5" fill="none"/><circle cx="100" cy="148" r="11" fill="${GOLD}" stroke="#c9952a" stroke-width="2"/><path d="M100 142 L102 147 L107 147 L103 150 L105 155 L100 152 L95 155 L97 150 L93 147 L98 147 Z" fill="${WHITE}"/>`,
};

const EXTRAS = {
  sparkles: `<g class="sparkles" fill="${GOLD}">${[[30, 50, 1], [170, 40, 0.8], [168, 110, 0.6], [26, 120, 0.7]]
    .map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z"/>`)
    .join('')}</g>`,
  thought: `<g class="float" fill="#c9d4e8"><circle cx="160" cy="44" r="5"/><circle cx="172" cy="28" r="7"/><circle cx="186" cy="10" r="9"/></g>`,
  zzz: `<g class="float" fill="${BLUE}" font-family="Georgia, serif" font-weight="700"><text x="150" y="40" font-size="18">z</text><text x="164" y="24" font-size="14">z</text><text x="176" y="12" font-size="10">z</text></g>`,
  notes: `<g class="float" fill="${BLUE}"><path d="M160 40 v-22 l14 -4 v22" stroke="${BLUE}" stroke-width="3" fill="none"/><circle cx="157" cy="41" r="5"/><circle cx="171" cy="37" r="5"/><path d="M30 60 v-16" stroke="${BLUE}" stroke-width="3"/><circle cx="27" cy="61" r="5"/></g>`,
};

const PHONES = `<g><path d="M40 78 Q100 -8 160 78" stroke="${INK}" stroke-width="7" fill="none"/><rect x="30" y="66" width="16" height="30" rx="7" fill="${BLUE}"/><rect x="154" y="66" width="16" height="30" rx="7" fill="${BLUE}"/></g>`;

export function outfitFor(stage = 0, equipped = {}) {
  const base = STAGES[Math.max(0, Math.min(STAGES.length - 1, stage))];
  const out = { ...base };
  for (const slot of ['head', 'eyes', 'neck']) {
    if (equipped[slot] === 'none') delete out[slot];
    else if (equipped[slot]) out[slot] = equipped[slot];
  }
  return out;
}

export function panda({ mood = 'happy', size = 120, stage = 0, equipped = {}, label = '', className = '' } = {}) {
  const cfg = MOOD_CONFIG[mood] ?? MOOD_CONFIG.happy;
  const outfit = outfitFor(stage, equipped);
  const neck = outfit.neck && NECK_ITEMS[outfit.neck] ? NECK_ITEMS[outfit.neck]() : '';
  // L'écharpe se glisse sous le menton ; nœud et collier se portent devant.
  const neckUnder = ['scarf', 'redscarf'].includes(outfit.neck) ? neck : '';
  const neckOver = neckUnder ? '' : neck;
  const head = outfit.head && !cfg.phones ? HEAD_ITEMS[outfit.head] ?? '' : '';
  const eyesItem = outfit.eyes && !['sleep'].includes(mood) ? EYE_ITEMS[outfit.eyes] ?? '' : '';
  const [la, ra] = cfg.arms;
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';

  return `<svg class="panda mood-${mood} ${cfg.jump ? 'jump' : ''} ${className}" width="${size}" height="${size}" viewBox="0 0 200 200" ${a11y}>
    <ellipse cx="100" cy="191" rx="48" ry="6" fill="#0b1b33" opacity=".1"/>
    <g class="panda-body">
      <ellipse cx="74" cy="178" rx="19" ry="13" fill="${INK}"/>
      <ellipse cx="126" cy="178" rx="19" ry="13" fill="${INK}"/>
      <ellipse cx="100" cy="146" rx="50" ry="42" fill="${WHITE}" stroke="${INK}" stroke-width="3"/>
      ${neckUnder}
      ${Math.abs(la) <= 90 ? arm(62, 126, la, 'arm-l') : ''}
      ${Math.abs(ra) <= 90 ? arm(138, 126, ra, 'arm-r') : ''}
      ${cfg.hold && cfg.hold !== 'medal' ? HOLD[cfg.hold] : ''}
      <circle cx="54" cy="40" r="21" fill="${INK}"/>
      <circle cx="146" cy="40" r="21" fill="${INK}"/>
      <ellipse cx="100" cy="80" rx="64" ry="55" fill="${WHITE}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="74" cy="86" rx="15" ry="20" fill="${INK}" transform="rotate(32 74 86)"/>
      <ellipse cx="126" cy="86" rx="15" ry="20" fill="${INK}" transform="rotate(-32 126 86)"/>
      <g class="eyes" style="transform-origin:100px 84px">${eye(76, 84, cfg.eyes, 'l')}${eye(124, 84, cfg.eyes, 'r')}</g>
      <ellipse cx="60" cy="105" rx="9" ry="5" fill="${BLUSH}" opacity=".85"/>
      <ellipse cx="140" cy="105" rx="9" ry="5" fill="${BLUSH}" opacity=".85"/>
      <ellipse cx="100" cy="99" rx="7" ry="5" fill="${INK}"/>
      ${mouth(cfg.mouth)}
      ${neckOver}
      ${cfg.hold === 'medal' ? HOLD.medal : ''}
      ${Math.abs(la) > 90 ? arm(62, 126, la, 'arm-l') : ''}
      ${Math.abs(ra) > 90 ? arm(138, 126, ra, `arm-r ${cfg.wave ? 'waving' : ''}`) : ''}
      ${eyesItem}
      ${head}
      ${cfg.phones ? PHONES : ''}
    </g>
    ${cfg.extra ? EXTRAS[cfg.extra] : ''}
  </svg>`;
}

// Le jardin de bambous de Bao : il pousse avec les éléments maîtrisés et se
// décore avec les objets de la boutique. Le ciel change avec le niveau.
const SKIES = [
  ['#dbe8ff', '#f5f8ff'],
  ['#c9dcff', '#eef3ff'],
  ['#a9c4ff', '#e0eaff'],
  ['#6f93e6', '#c3d4fb'],
  ['#2a4f9e', '#7f9fe0'],
  ['#0b1b33', '#24427f'],
];

export function garden({ stalks = 2, level = 0, decor = [], width = 640, height = 170 } = {}) {
  const [top, bottom] = SKIES[Math.max(0, Math.min(5, level))];
  const night = level >= 4;
  const n = Math.max(1, Math.min(28, stalks));
  let bamboo = '';
  for (let i = 0; i < n; i++) {
    const x = 24 + ((i * 97) % (width - 48));
    const h = 50 + ((i * 37) % 70);
    const y = height - 26 - h;
    const segs = Math.floor(h / 22);
    let joints = '';
    for (let s = 1; s <= segs; s++) joints += `<rect x="${x - 1}" y="${y + s * 22}" width="10" height="2.5" rx="1" fill="#2f7d4c"/>`;
    bamboo += `<g class="stalk" style="animation-delay:${(i % 5) * 0.3}s; transform-origin:${x + 4}px ${height - 26}px">
      <rect x="${x}" y="${y}" width="8" height="${h}" rx="4" fill="#4caf6e"/>${joints}
      <ellipse cx="${x + 14}" cy="${y + 8}" rx="10" ry="3.5" fill="#6cc98b" transform="rotate(-25 ${x + 14} ${y + 8})"/>
      <ellipse cx="${x - 6}" cy="${y + 20}" rx="9" ry="3" fill="#6cc98b" transform="rotate(25 ${x - 6} ${y + 20})"/>
    </g>`;
  }
  const stars = night
    ? Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 131) % width}" cy="${8 + ((i * 53) % 70)}" r="${i % 3 === 0 ? 1.6 : 1}" fill="#fff" opacity=".8"/>`).join('')
    : '';
  const sun = night
    ? `<circle cx="${width - 60}" cy="36" r="16" fill="#f5f1d6"/><circle cx="${width - 53}" cy="31" r="14" fill="${top}"/>`
    : `<circle cx="${width - 60}" cy="38" r="18" fill="#ffd98a" opacity=".9"/>`;
  const items = {
    lantern: `<g transform="translate(${width * 0.18} ${height - 92})"><path d="M10 0 V10" stroke="#5b4636" stroke-width="2"/><rect x="0" y="10" width="20" height="26" rx="8" fill="#e85d75"/><rect x="4" y="16" width="12" height="14" rx="5" fill="#ffd166" opacity=".8"/></g>`,
    cherry: `<g transform="translate(${width * 0.82} ${height - 120})"><rect x="16" y="40" width="8" height="56" rx="3" fill="#7a5640"/><circle cx="20" cy="34" r="26" fill="#ffc2d4"/><circle cx="2" cy="44" r="16" fill="#ffd3e0"/><circle cx="38" cy="44" r="16" fill="#ffb3c7"/></g>`,
    pond: `<ellipse cx="${width * 0.5}" cy="${height - 14}" rx="70" ry="9" fill="#7fb6f0" opacity=".9"/><ellipse cx="${width * 0.5 - 20}" cy="${height - 15}" rx="9" ry="3" fill="#4caf6e"/>`,
    bridge: `<path d="M${width * 0.36} ${height - 26} Q${width * 0.5} ${height - 62} ${width * 0.64} ${height - 26}" stroke="#c23b4a" stroke-width="7" fill="none"/>`,
    fireflies: `<g class="float" fill="#ffe680">${Array.from({ length: 8 }, (_, i) => `<circle cx="${60 + i * 70}" cy="${height - 60 - (i % 3) * 18}" r="2.4"/>`).join('')}</g>`,
  };
  return `<svg class="garden" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="sky${level}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#sky${level})"/>
    ${stars}${sun}
    <path d="M0 ${height - 30} Q${width * 0.25} ${height - 52} ${width * 0.5} ${height - 34} T${width} ${height - 36} V${height} H0 Z" fill="#8fd1a4"/>
    <rect y="${height - 28}" width="${width}" height="28" fill="#6cc98b"/>
    ${decor.includes('bridge') ? items.bridge : ''}
    ${bamboo}
    ${decor.filter((d) => d !== 'bridge').map((d) => items[d] ?? '').join('')}
  </svg>`;
}

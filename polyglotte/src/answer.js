// Vérification des réponses avec un diagnostic précis.
// Là où Duolingo affiche souvent un simple « Mauvaise réponse », on explique
// ce qui ne va pas : accent, faute de frappe, ordre des mots, mot manquant…

const EN_CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are',
  "he's": 'he is', "she's": 'she is', "it's": 'it is', "that's": 'that is',
  "what's": 'what is', "where's": 'where is', "there's": 'there is', "who's": 'who is',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "isn't": 'is not',
  "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "can't": 'cannot',
  "won't": 'will not', "i'd": 'i would', "you'd": 'you would', "i'll": 'i will',
  "you'll": 'you will', "we'll": 'we will', "they'll": 'they will', "i've": 'i have',
  "you've": 'you have', "we've": 'we have', "let's": 'let us',
};

const ARTICLES = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'a', 'an', 'the']);

export function stripAccents(s) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').normalize('NFC');
}

export function normalize(s, lang) {
  let out = String(s)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[¿¡.,!?;:"«»…()“”-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (lang === 'en') {
    out = out
      .split(' ')
      .map((w) => EN_CONTRACTIONS[w] ?? w)
      .join(' ')
      .replace(/\bcan not\b/g, 'cannot');
  }
  if (lang === 'de') out = out.replace(/ß/g, 'ss');
  // Apostrophe finale facultative (it. « po' », « un po » tapé sans apostrophe).
  return out.replace(/'(?=\s|$)/g, '').trim();
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

function typoTolerance(word) {
  if (word.length <= 3) return 0;
  if (word.length <= 7) return 1;
  return 2;
}

// Différence mot à mot (plus longue sous-séquence commune) entre la réponse
// attendue et la réponse saisie, pour surligner ce qui manque ou est en trop.
export function wordDiff(expectedWords, givenWords) {
  const n = expectedWords.length;
  const m = givenWords.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = expectedWords[i] === givenWords[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (expectedWords[i] === givenWords[j]) {
      ops.push({ type: 'same', word: expectedWords[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ type: 'missing', word: expectedWords[i++] });
    } else {
      ops.push({ type: 'extra', word: givenWords[j++] });
    }
  }
  while (i < n) ops.push({ type: 'missing', word: expectedWords[i++] });
  while (j < m) ops.push({ type: 'extra', word: givenWords[j++] });
  return ops;
}

function removeOne(words, other) {
  // Si `words` contient exactement un mot de plus que `other`, renvoie ce mot.
  if (words.length !== other.length + 1) return null;
  for (let k = 0; k < words.length; k++) {
    const rest = words.slice(0, k).concat(words.slice(k + 1));
    if (rest.join(' ') === other.join(' ')) return words[k];
  }
  return null;
}

function evaluate(input, expected, lang, strictAccents) {
  const a = normalize(input, lang);
  const b = normalize(expected, lang);
  if (!a) return { status: 'wrong', score: 0, issues: [{ type: 'empty' }] };
  if (a === b) return { status: 'correct', score: 3, issues: [] };

  const aw = a.split(' ');
  const bw = b.split(' ');

  // 1. Uniquement des accents
  if (stripAccents(a) === stripAccents(b)) {
    const issues = [];
    bw.forEach((w, k) => {
      if (aw[k] !== w) issues.push({ type: 'accent', got: aw[k], expected: w });
    });
    return { status: strictAccents ? 'wrong' : 'almost', score: 2, issues };
  }

  const sa = stripAccents(a).split(' ');
  const sb = stripAccents(b).split(' ');

  // 2. Même nombre de mots : article, fautes de frappe
  if (sa.length === sb.length) {
    const diffs = [];
    sb.forEach((w, k) => {
      if (sa[k] !== w) diffs.push(k);
    });
    if (diffs.length === 1 && ARTICLES.has(sb[diffs[0]]) && ARTICLES.has(sa[diffs[0]])) {
      const k = diffs[0];
      return { status: 'wrong', score: 1, issues: [{ type: 'article', got: aw[k], expected: bw[k] }] };
    }
    const maxTypos = Math.max(1, Math.floor(sb.length / 4));
    const allTypos = diffs.every((k) => levenshtein(sa[k], sb[k]) <= typoTolerance(sb[k]));
    if (diffs.length > 0 && diffs.length <= maxTypos && allTypos) {
      return {
        status: 'almost',
        score: 2,
        issues: diffs.map((k) => ({ type: 'typo', got: aw[k], expected: bw[k] })),
      };
    }
  }

  // 3. Les bons mots dans le désordre
  if ([...sa].sort().join(' ') === [...sb].sort().join(' ')) {
    return { status: 'wrong', score: 1, issues: [{ type: 'order' }], diff: wordDiff(bw, aw) };
  }

  // 4. Un mot oublié ou en trop
  const missing = removeOne(sb, sa);
  if (missing) {
    return { status: 'wrong', score: 1, issues: [{ type: 'missing', expected: bw[sb.indexOf(missing)] }], diff: wordDiff(bw, aw) };
  }
  const extra = removeOne(sa, sb);
  if (extra) {
    return { status: 'wrong', score: 1, issues: [{ type: 'extra', got: aw[sa.indexOf(extra)] }], diff: wordDiff(bw, aw) };
  }

  return { status: 'wrong', score: 0, issues: [{ type: 'different' }], diff: wordDiff(bw, aw) };
}

const RANK = { correct: 2, almost: 1, wrong: 0 };

export function checkAnswer(input, accepted, { lang, strictAccents = false } = {}) {
  let best = null;
  for (const expected of accepted) {
    const r = { ...evaluate(input, expected, lang, strictAccents), expected };
    if (
      !best ||
      RANK[r.status] > RANK[best.status] ||
      (RANK[r.status] === RANK[best.status] && r.score > best.score)
    ) {
      best = r;
    }
  }
  return { ...best, canonical: accepted[0], message: describe(best) };
}

export function describe(result) {
  if (result.status === 'correct') return 'Parfait !';
  const parts = result.issues.map((issue) => {
    switch (issue.type) {
      case 'accent':
        return `Attention à l'accent : « ${issue.expected} » (et non « ${issue.got ?? '…'} »).`;
      case 'typo':
        return `Petite faute de frappe : « ${issue.expected} » (vous avez écrit « ${issue.got} »).`;
      case 'article':
        return `Mauvais article : « ${issue.expected} » et non « ${issue.got} ». Vérifiez le genre ou le nombre du nom.`;
      case 'order':
        return "Tous les mots sont là, mais pas dans le bon ordre.";
      case 'missing':
        return `Il manque un mot : « ${issue.expected} ».`;
      case 'extra':
        return `Un mot est en trop : « ${issue.got} ».`;
      case 'empty':
        return "Vous n'avez rien écrit.";
      default:
        return 'Ce n’est pas tout à fait ça. Comparez avec la bonne réponse ci-dessous.';
    }
  });
  if (result.status === 'almost') parts.push('Réponse acceptée.');
  return parts.join(' ');
}

// Grade de répétition espacée correspondant au résultat.
export function gradeFor(status) {
  if (status === 'correct') return 'good';
  if (status === 'almost') return 'hard';
  return 'again';
}

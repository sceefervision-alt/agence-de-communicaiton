// Audio : synthèse vocale (écoute, dictée) et reconnaissance vocale (oral).
// Tout passe par les API du navigateur, sans service externe.

import { t } from './i18n.js';

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function canRecognize() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Le navigateur ne dit pas si une voix est féminine ni si elle sonne
// humain : on le devine d'après son nom. On privilégie les voix neuronales
// (« Natural », « Online », « Premium », « Enhanced »…) et féminines, et on
// écarte les voix robotiques ou fantaisie.
const QUALITY = /natural|neural|online|premium|enhanced|wavenet|journey|studio|siri/i;
const ROBOTIC = /espeak|compact|eloquence|\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
const MALE = /\bmale\b|\b(david|mark|george|guy|ryan|daniel|alex|fred|thomas|paul|jorge|diego|juan|luca|cosimo|henri|yannick|claude|stefan|hans|markus|conrad|killian|ivan|pablo|raul|rishi|aaron|arthur|oliver|gordon|christopher|eric|brian|andrew|roger|steffan|liam|davis|tony|jason|remy|alvaro|antonio|duarte|benigno|felipe|maged|tarik|naayf|hamed|shakir|bassel|hamdan|fahed|rami|zayd|otoya|takumi|keita|ichiro|kangkang|yunyang|yunxi|yunjian|injoon|hyunsu|dmitry|pavel|filip|xander|frank|ralph|bruce|junior|nicolas|rocco|giorgio|carlos|enrique|ricardo|reinaldo|federico|gianni|lorenzo|arnaud|jacques|ahmed|omar|jamal|matthew|joey|justin|kevin|brian|russell|geraint|giorgos|tomas|jan|jakub|lukas|seppo|magnus|stig|aleksander|sven)\b/i;
const FEMALE = /\bfemale\b|\b(aria|jenny|michelle|ana|sonia|libby|maisie|natasha|clara|denise|eloise|vivienne|brigitte|celeste|coralie|josephine|yvette|katja|amala|seraphina|louisa|tanja|elsa|isabella|elvira|dalia|francisca|thalita|raquel|salma|zariyah|nanami|xiaoxiao|xiaoyi|sunhi|zira|hazel|susan|hortense|julie|hedda|helena|laura|sabina|heami|huihui|yaoyao|haruka|ayumi|irina|svetlana|dariya|paulina|maria|hoda|hanna|samantha|karen|moira|tessa|fiona|victoria|allison|ava|zoe|serena|kate|amelie|amélie|audrey|aurelie|aurélie|marie|anna|petra|alice|federica|paola|monica|mónica|marisol|luciana|joana|catarina|fernanda|kyoko|o-ren|yuna|tingting|sinji|mei-jia|milena|katya|laila|mariam|zuzana|ioana|ellen|klara|nora|sara|yelda|lekha|damayanti|kanya|lesya|melina|carmit|mariska|emma|olivia|nicole|joanna|kendra|kimberly|salli|ivy|ruth|lea|léa|celine|céline|vicki|marlene|conchita|lucia|lupe|penelope|ines|inês|vitoria|camila|bianca|carla|giorgia|zeina|amy|emily|jessica|ashley|cora|elizabeth|jane|nancy|zhiyu|yating|hanhan|ellie|isla|abbi|bella|hollie|jemima|alba|sylvie|ariane|charline|neerja|swara|pallavi|fatima|amira|rana|salwa)\b/i;

const norm = (lang) => (lang ?? '').replace('_', '-').toLowerCase();

export function voiceScore(voice, lang) {
  const vl = norm(voice.lang);
  const want = norm(lang);
  let score = vl === want ? 100 : vl.split('-')[0] === want.split('-')[0] ? 60 : -Infinity;
  const name = voice.name ?? '';
  if (QUALITY.test(name)) score += 30;
  if (MALE.test(name)) score -= 40;
  else if (FEMALE.test(name)) score += 25;
  // Les voix Google du navigateur sont féminines, sauf mention « Male ».
  else if (/^google/i.test(name)) score += 15;
  if (ROBOTIC.test(name)) score -= 50;
  if (voice.default) score += 2;
  return score;
}

// Voix de la langue, de la plus naturelle et féminine à la moins adaptée.
export function rankVoices(voices, lang) {
  if (!lang) return [];
  return voices
    .map((v) => ({ v, s: voiceScore(v, lang) }))
    .filter((x) => x.s > -Infinity)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.v);
}

export const isLikelyFemale = (voice) => !MALE.test(voice.name ?? '') && (FEMALE.test(voice.name ?? '') || /^google/i.test(voice.name ?? ''));

// Chrome charge la liste des voix après coup : on l'attend un instant.
let voicesReady = null;
function loadVoices() {
  const now = window.speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  voicesReady ??= new Promise((resolve) => {
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener?.('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  }).finally(() => (voicesReady = null));
  return voicesReady;
}

export async function listVoices(lang) {
  if (!canSpeak()) return [];
  return rankVoices(await loadVoices(), lang);
}

// Les longs textes sont lus par morceaux de quelques phrases : les voix en
// ligne ne se coupent plus en plein milieu, et les phrases courtes restent
// enchaînées avec l'intonation naturelle de la voix.
export function sentences(text) {
  return (text.match(/[^.!?…。！？؟]+[.!?…。！？؟]*["”»’)]*\s*/g) ?? [text]).map((x) => x.trim()).filter(Boolean);
}

export function chunks(text, max = 160) {
  const out = [];
  for (const sentence of sentences(text)) {
    const last = out.length - 1;
    if (last >= 0 && out[last].length + sentence.length < max) out[last] += ` ${sentence}`;
    else out.push(sentence);
  }
  return out;
}

function utter(text, lang, voice, { rate, pitch }) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? lang;
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = pitch;
    u.onend = () => resolve(null);
    u.onerror = (e) => resolve(e.error ?? 'error');
    window.speechSynthesis.speak(u);
  });
}

let current = 0;

// Lit un texte à voix haute ; la promesse se résout à la fin de la lecture.
// `voice` : identifiant d'une voix choisie dans les réglages ;
// `second` : une autre voix, pour le deuxième personnage d'un dialogue.
export async function speak(text, lang, { rate = 0.95, pitch = 1, voice: wanted = null, second = false } = {}) {
  if (!canSpeak() || !text) return;
  window.speechSynthesis.cancel();
  const token = ++current;
  const ranked = rankVoices(await loadVoices(), lang);
  if (token !== current) return;
  let voice = ranked.find((v) => v.voiceURI === wanted) ?? ranked[0] ?? null;
  if (second) {
    const other = ranked.find((v) => v !== voice && isLikelyFemale(v) === isLikelyFemale(voice ?? {}));
    if (other) voice = other;
    else pitch *= 1.12;
  }
  for (const part of chunks(text)) {
    if (token !== current) return;
    let error = await utter(part, lang, voice, { rate, pitch });
    // Voix en ligne sans connexion : on bascule sur une voix de l'appareil.
    if (error && error !== 'interrupted' && error !== 'canceled' && voice && !voice.localService) {
      voice = ranked.find((v) => v.localService) ?? null;
      error = await utter(part, lang, voice, { rate, pitch });
    }
    if (error) return;
  }
}

export function stopSpeaking() {
  current++;
  if (canSpeak()) window.speechSynthesis.cancel();
}

// Renvoie les transcriptions candidates (de la plus probable à la moins probable).
export function recognize(lang, { timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!canRecognize()) {
      reject(new Error(t('Reconnaissance vocale indisponible dans ce navigateur.')));
      return;
    }
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    let done = false;
    const timer = setTimeout(() => {
      if (!done) rec.stop();
    }, timeoutMs);
    rec.onresult = (event) => {
      done = true;
      clearTimeout(timer);
      const alts = [];
      for (const alt of event.results[0]) alts.push(alt.transcript);
      resolve(alts);
    };
    rec.onerror = (event) => {
      done = true;
      clearTimeout(timer);
      reject(new Error(t(event.error === 'not-allowed' ? 'Micro non autorisé.' : 'Je n’ai rien entendu.')));
    };
    rec.onend = () => {
      clearTimeout(timer);
      if (!done) reject(new Error(t('Je n’ai rien entendu.')));
    };
    rec.start();
  });
}

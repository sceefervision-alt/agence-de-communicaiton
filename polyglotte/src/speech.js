// Audio : synthèse vocale (écoute, dictée) et reconnaissance vocale (oral).
// Tout passe par les API du navigateur, sans service externe.

import { t } from './i18n.js';

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function canRecognize() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  if (!lang) return null;
  const short = lang.split('-')[0];
  return voices.find((v) => v.lang === lang) || voices.find((v) => v.lang?.startsWith(short)) || null;
}

// Lit un texte à voix haute ; la promesse se résout à la fin de la lecture.
export function speak(text, lang, { rate = 0.95 } = {}) {
  if (!canSpeak() || !text) return Promise.resolve();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (lang) u.lang = lang;
  u.rate = rate;
  const voice = lang ? pickVoice(lang) : null;
  if (voice) u.voice = voice;
  return new Promise((resolve) => {
    u.onend = resolve;
    u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
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

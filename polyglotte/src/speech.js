// Audio : synthèse vocale (écoute, dictée) et reconnaissance vocale (oral).
// Tout passe par les API du navigateur, sans service externe.

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function canRecognize() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  const short = lang.split('-')[0];
  return voices.find((v) => v.lang === lang) || voices.find((v) => v.lang?.startsWith(short)) || null;
}

export function speak(text, lang, { rate = 0.95 } = {}) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

// Renvoie les transcriptions candidates (de la plus probable à la moins probable).
export function recognize(lang, { timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!canRecognize()) {
      reject(new Error('Reconnaissance vocale indisponible dans ce navigateur.'));
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
      reject(new Error(event.error === 'not-allowed' ? 'Micro non autorisé.' : "Je n'ai rien entendu."));
    };
    rec.onend = () => {
      clearTimeout(timer);
      if (!done) reject(new Error("Je n'ai rien entendu."));
    };
    rec.start();
  });
}

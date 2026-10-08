// Service worker : l'application fonctionne entièrement hors ligne.
const CACHE = 'polyglotte-v8';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'icons/icon.svg',
  'src/main.js',
  'src/app-state.js',
  'src/session-view.js',
  'src/chat-view.js',
  'src/bao-view.js',
  'src/answer.js',
  'src/srs.js',
  'src/session.js',
  'src/progress.js',
  'src/storage.js',
  'src/speech.js',
  'src/panda.js',
  'src/rewards.js',
  'src/course.js',
  'src/curriculum.js',
  'src/languages.js',
  'src/generator.js',
  'src/tutor.js',
  'src/data/index.js',
  'src/data/es.js',
  'src/data/en.js',
  'src/data/de.js',
  'src/data/it.js',
  'src/data/pt.js',
  'src/data/pro-a1.js',
  'src/data/en-a2-b1.js',
  'src/data/es-a2-b1.js',
  'src/data/pt-a2-b1.js',
  'src/scripted-tutor.js',
  'src/visual.js',
  'src/confetti.js',
  'src/reveal.js',
  'src/splash.js',
  'src/onboarding.js',
  'src/i18n.js',
  'src/i18n/en.js',
  'src/i18n/es.js',
  'src/i18n/pt.js',
  'src/i18n/de.js',
  'src/i18n/it.js',
  'src/i18n/ar.js',
  'src/locale.js',
  'src/base-language.js',
  'src/sky.js',
  'src/env.js',
  'src/three/engine.js',
  'src/three/toon.js',
  'src/three/bao3d.js',
  'src/three/garden3d.js',
  'src/three/chest3d.js',
  'src/three/stage.js',
  'vendor/three.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Réseau d'abord (pour recevoir les mises à jour), cache en secours.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.includes('/api/')) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});

const CACHE = 'energy-quest-v1';
const FILES = [
  '/index.html',
  '/character-select.html',
  '/prologue.html',
  '/stage1.html',
  '/stage2.html',
  '/stage3.html',
  '/stage4.html',
  '/manifest.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

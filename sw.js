const CACHE = 'energy-quest-v2';
const FILES = [
  '/index.html',
  '/character-select.html',
  '/prologue.html',
  '/stage1.html',
  '/stage2.html',
  '/stage3.html',
  '/stage4.html',
  '/manifest.json',
  '/audio/bgm.mp3',
  '/audio/stage_clear.mp3',
  '/audio/quiz_answer_npc_talk.mp3',
  '/audio/quiz_false.mp3',
  '/audio/quiz_true.mp3',
  '/audio/victory.mp3',
  '/audio/item_collect.mp3',
  '/audio/wind.mp3',
  '/audio/warp.mp3',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
  ));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

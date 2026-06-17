// 에너지 퀘스트 — 서비스 워커 (PWA)
// 네트워크 우선: 온라인이면 항상 최신을 보여주고(업데이트 즉시 반영),
// 오프라인일 때만 캐시로 폴백. (예전엔 '캐시 우선'이라 업데이트가 안 보였음)
const CACHE = 'energy-quest-v3';
const FILES = [
  '/index.html',
  '/character-select.html',
  '/prologue.html',
  '/stage1.html', '/stage2.html', '/stage3.html', '/stage4.html', '/stage5.html', '/stage6.html',
  '/worldmap.html', '/dogam.html',
  '/eq-audio.js', '/eq-nav.js', '/eq-fx.js', '/eq-ui.css',
  '/manifest.json',
  '/audio/bgm.mp3', '/audio/stage_clear.mp3', '/audio/quiz_answer_npc_talk.mp3',
  '/audio/quiz_false.mp3', '/audio/quiz_true.mp3', '/audio/victory.mp3',
  '/audio/item_collect.mp3', '/audio/wind.mp3', '/audio/warp.mp3',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // 네트워크 우선 → 실패(오프라인) 시 캐시
  e.respondWith(
    fetch(e.request)
      .then(res => {
        try {
          if (new URL(e.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
          }
        } catch (_) {}
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// 에너지 퀘스트 — 서비스 워커 (PWA)
// 네트워크 우선: 온라인이면 항상 최신을 보여주고(업데이트 즉시 반영),
// 오프라인일 때만 캐시로 폴백. (예전엔 '캐시 우선'이라 업데이트가 안 보였음)
const CACHE = 'energy-quest-v8';
const FILES = [
  // 글꼴은 CSS만 미리 받아 둔다. 실제 woff2는 유니코드 범위별로 잘려 있어
  // (222개·4.8MB) 전부 미리 받으면 저사양 태블릿의 첫 실행이 무거워진다.
  // 화면에 쓰인 범위만 fetch 핸들러가 실행 중에 캐시한다.
  '/fonts/eq-fonts.css',
  '/index.html',
  '/character-select.html',
  '/prologue.html',
  '/stage1.html', '/stage2.html', '/stage3.html', '/stage4.html', '/stage5.html', '/stage6.html',
  '/stage6_boss_battle_v4.html', '/clear.html',
  '/worldmap.html', '/dogam.html', '/review.html', '/credits.html',
  '/eq-audio.js', '/eq-nav.js', '/eq-char.js', '/eq-fx.js', '/eq-terrain.js', '/eq-perf.js', '/eq-log.js', '/eq-ui.css',
  '/teacher.html',
  '/manifest.json', '/icon.svg',
  // 이 파일만 .wav — 자체 합성 음원 (eq-audio.js의 EXT와 맞춰야 한다)
  '/audio/quiz_answer_npc_talk.wav',
  '/audio/bgm.mp3', '/audio/stage_clear.mp3',
  '/audio/quiz_false.mp3', '/audio/quiz_true.mp3', '/audio/victory.mp3',
  '/audio/item_collect.mp3', '/audio/wind.mp3', '/audio/warp.mp3',
];
self.addEventListener('install', e => {
  // addAll은 목록 중 하나만 404여도 '전부' 실패한다. 예전에 오디오 파일 확장자가
  // 하나 어긋나 있어 프리캐시가 통째로 조용히 실패했었다.
  // 파일별로 담아 한 건이 실패해도 나머지는 캐시되도록 한다.
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(FILES.map(f => c.add(f).catch(() => {
        console.warn('[sw] precache skipped:', f);
      })))
    ).catch(()=>{})
  );
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
  const req = e.request;
  if (req.method !== 'GET') return;
  // 네트워크 우선 + 항상 최신(브라우저 캐시 무시) → 옛 화면이 먼저 뜨는 문제 방지.
  // navigate 요청엔 init를 줄 수 없으므로(스펙상 throw) URL로 새 요청을 만든다.
  const fresh = (req.mode === 'navigate')
    ? fetch(req.url, { cache: 'no-cache' })
    : fetch(req, { cache: 'no-cache' });
  e.respondWith(
    fresh
      .then(res => {
        try {
          if (new URL(req.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
          }
        } catch (_) {}
        return res;
      })
      .catch(() => caches.match(req))   // 오프라인일 때만 캐시 폴백
  );
});

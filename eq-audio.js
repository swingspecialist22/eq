// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 공용 오디오 엔진 (eq-audio.js)
//
// 기존에 모든 스테이지(stage1~6 등)에 똑같이 복붙돼 있던 SFX/BGM 코드를
// 이 파일 "하나"로 모은 것. 각 스테이지는 인라인 정의 대신
//   <script src="eq-audio.js"></script>
// 한 줄만 넣으면 된다. 효과음/배경음을 바꾸려면 여기만 고치면 전체 반영.
//
// 사용법: SFX.play('warp'), SFX.bgmStart(), SFX.bgmToggle() 등
//         audio/ 폴더의 mp3 파일명을 그대로 넘긴다.
// 의존: <body>에 id="bgm-toggle" 버튼이 있어야 토글이 연결됨.
// ════════════════════════════════════════════════════════════
const SFX = (function(){
  const BASE = 'audio/';
  const cache = {};
  function get(name){
    if(!cache[name]){
      cache[name] = new Audio(BASE + name + '.mp3');
      cache[name].preload = 'auto';
    }
    return cache[name];
  }
  let bgmEl = null;
  let bgmEnabled = localStorage.getItem('eq_bgm') !== 'off';
  return {
    play(name){
      try {
        const a = get(name).cloneNode();
        a.play().catch(()=>{});
      } catch(e){}
    },
    bgmStart(){
      if(!bgmEnabled || bgmEl) return;
      bgmEl = new Audio(BASE + 'bgm.mp3');
      bgmEl.loop = true;
      bgmEl.volume = 0.7;
      bgmEl.play().catch(()=>{ bgmEl = null; });
    },
    bgmStop(){
      if(bgmEl){ bgmEl.pause(); bgmEl = null; }
    },
    bgmToggle(){
      bgmEnabled = !bgmEnabled;
      localStorage.setItem('eq_bgm', bgmEnabled ? 'on' : 'off');
      if(bgmEnabled) this.bgmStart();
      else this.bgmStop();
      return bgmEnabled;
    },
    bgmIsOn(){ return bgmEnabled; }
  };
})();

// BGM: 즉시 자동재생 시도 → 실패 시 첫 상호작용 대기
(function(){
  SFX.bgmStart();
  function onInteract(){ SFX.bgmStart(); }
  document.addEventListener('touchstart', onInteract, {once:true});
  document.addEventListener('click', onInteract, {once:true});
  document.addEventListener('keydown', onInteract, {once:true});
  const btn = document.getElementById('bgm-toggle');
  if(!btn) return;
  function updateBtn(){ btn.textContent = SFX.bgmIsOn() ? '🎵 BGM ON' : '🔇 BGM OFF'; }
  updateBtn();
  btn.addEventListener('click', ()=>{ SFX.bgmToggle(); updateBtn(); });
})();

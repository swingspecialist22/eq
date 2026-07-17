// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 공용 오디오 엔진 (eq-audio.js)
// 모든 스테이지가 공유. BGM on/off + 효과음(SFX) on/off 둘 다 지원.
// 사용: SFX.play('warp'), SFX.bgmStart(), SFX.bgmToggle(), SFX.sfxToggle() 등
// 의존: <body>에 id="bgm-toggle" 버튼이 있으면 BGM·효과음 토글 버튼이 자동 연결됨.
// ════════════════════════════════════════════════════════════
const SFX = (function(){
  const BASE = 'audio/';
  // 기본 확장자는 .mp3, 자체 제작(합성) 효과음은 .wav
  const EXT = { quiz_answer_npc_talk: '.wav' };
  const cache = {};
  function get(name){
    if(!cache[name]){
      cache[name] = new Audio(BASE + name + (EXT[name] || '.mp3'));
      cache[name].preload = 'auto';
    }
    return cache[name];
  }
  let bgmEl = null;
  let bgmEnabled = localStorage.getItem('eq_bgm') !== 'off';
  let sfxEnabled = localStorage.getItem('eq_sfx') !== 'off';   // 효과음 on/off
  return {
    play(name){
      if(!sfxEnabled) return;            // 효과음 꺼져 있으면 무시
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
    bgmIsOn(){ return bgmEnabled; },
    sfxToggle(){
      sfxEnabled = !sfxEnabled;
      localStorage.setItem('eq_sfx', sfxEnabled ? 'on' : 'off');
      return sfxEnabled;
    },
    sfxIsOn(){ return sfxEnabled; }
  };
})();

// BGM 자동재생 + BGM/효과음 토글 버튼 연결
(function(){
  SFX.bgmStart();
  function onInteract(){ SFX.bgmStart(); }
  document.addEventListener('touchstart', onInteract, {once:true});
  document.addEventListener('click', onInteract, {once:true});
  document.addEventListener('keydown', onInteract, {once:true});

  const btn = document.getElementById('bgm-toggle');
  if(!btn) return;   // 메뉴 화면 등 토글 버튼 없는 곳은 패스

  function updateBgm(){ btn.textContent = SFX.bgmIsOn() ? '🎵 BGM ON' : '🔇 BGM OFF'; btn.classList.toggle('off', !SFX.bgmIsOn()); }
  updateBgm();
  btn.addEventListener('click', ()=>{ SFX.bgmToggle(); updateBgm(); });

  // 효과음 토글 버튼을 BGM 버튼 바로 뒤에 주입 (스타일은 eq-ui.css의 #sfx-toggle)
  if(!document.getElementById('sfx-toggle')){
    const sb = document.createElement('button');
    sb.id = 'sfx-toggle';
    sb.type = 'button';
    function updateSfx(){ sb.textContent = SFX.sfxIsOn() ? '🔊 효과음 ON' : '🔈 효과음 OFF'; sb.classList.toggle('off', !SFX.sfxIsOn()); }
    updateSfx();
    sb.addEventListener('click', ()=>{ SFX.sfxToggle(); updateSfx(); });
    btn.parentNode.insertBefore(sb, btn.nextSibling);
  }
})();

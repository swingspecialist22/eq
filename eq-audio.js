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
  let autoPaused = false;      // 화면이 내려가서 '자동으로' 멈춘 상태인지(사용자 OFF와 구분)
  const liveSfx = new Set();   // 재생 중인 효과음 클론(백그라운드 진입 시 같이 끊기 위해)
  return {
    play(name){
      if(!sfxEnabled) return;            // 효과음 꺼져 있으면 무시
      try {
        const a = get(name).cloneNode();
        liveSfx.add(a);
        a.addEventListener('ended', ()=>{ liveSfx.delete(a); });
        a.play().catch(()=>{ liveSfx.delete(a); });
      } catch(e){}
    },
    bgmStart(){
      if(!bgmEnabled || bgmEl) return;
      autoPaused = false;
      bgmEl = new Audio(BASE + 'bgm.mp3');
      bgmEl.loop = true;
      bgmEl.volume = 0.7;
      bgmEl.play().catch(()=>{ bgmEl = null; });
    },
    bgmStop(){
      autoPaused = false;
      if(bgmEl){ bgmEl.pause(); bgmEl = null; }
    },
    // ── 앱이 백그라운드로 갈 때(홈 버튼·탭 전환·화면 끔) 모든 소리를 멈춘다 ──
    // bgmStop과 달리 bgmEl을 버리지 않아서, 돌아오면 멈춘 지점부터 이어진다.
    // bgmEnabled(사용자 설정)는 건드리지 않으므로 버튼 표시도 그대로 유지된다.
    suspend(){
      liveSfx.forEach(a=>{ try{ a.pause(); }catch(e){} });
      liveSfx.clear();
      if(bgmEl && !bgmEl.paused){ bgmEl.pause(); autoPaused = true; }
    },
    // 돌아왔을 때 재개. 자동으로 멈춘 경우에만(사용자가 끈 BGM은 계속 꺼둠).
    resume(){
      if(!autoPaused || !bgmEnabled) return;
      autoPaused = false;
      if(bgmEl) bgmEl.play().catch(()=>{ bgmEl = null; });
      else this.bgmStart();
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

  // ── 화면이 내려가면 소리도 내린다 ──
  // 모바일 브라우저(삼성 인터넷·크롬 등)는 홈 버튼으로 앱을 내려도 <audio>를 계속
  // 재생한다. 배경으로 가는 순간을 직접 잡아서 멈추고, 돌아오면 이어서 재생한다.
  // window의 blur는 쓰지 않는다 — 지도 모달의 iframe에 포커스가 갈 때도 발생해서
  // 게임 중에 음악이 끊긴다. visibilitychange(홈·탭전환·화면끔) + pagehide(뒤로가기·
  // 앱 종료) 두 가지면 실제 이탈 상황은 모두 덮인다.
  var reArm = null;   // 자동재생 차단으로 재개가 막혔을 때 다음 터치에 한 번 더 시도
  function goHidden(){
    SFX.suspend();
    if(reArm){ document.removeEventListener('touchstart', reArm); document.removeEventListener('click', reArm); reArm = null; }
  }
  function goVisible(){
    SFX.resume();
    // 브라우저가 사용자 조작 없는 재생을 막았을 수 있으므로, 첫 터치/클릭에 재시도
    if(SFX.bgmIsOn() && !reArm){
      reArm = function(){ SFX.bgmStart(); reArm = null; };
      document.addEventListener('touchstart', reArm, {once:true});
      document.addEventListener('click', reArm, {once:true});
    }
  }
  document.addEventListener('visibilitychange', function(){
    if(document.hidden) goHidden(); else goVisible();
  });
  window.addEventListener('pagehide', goHidden);
  window.addEventListener('pageshow', goVisible);

  const btn = document.getElementById('bgm-toggle');
  if(!btn) return;   // 메뉴 화면 등 토글 버튼 없는 곳은 패스

  // 아이콘(.tico)/라벨(.tlbl)/상태(.tst)를 span으로 분리 — 좁은 화면에선 eq-ui.css가
  // 아이콘 위+라벨 아래 세로 배치로 바꾸고 상태 글자만 숨긴다(상태는 아이콘·흐림으로 표현).
  function updateBgm(){
    btn.innerHTML = SFX.bgmIsOn()
      ? '<span class="tico">🎵</span> <span class="tlbl">BGM<span class="tst"> ON</span></span>'
      : '<span class="tico">🔇</span> <span class="tlbl">BGM<span class="tst"> OFF</span></span>';
    btn.classList.toggle('off', !SFX.bgmIsOn());
  }
  updateBgm();
  btn.addEventListener('click', ()=>{ SFX.bgmToggle(); updateBgm(); });

  // 효과음 토글 버튼을 BGM 버튼 바로 뒤에 주입 (스타일은 eq-ui.css의 #sfx-toggle)
  if(!document.getElementById('sfx-toggle')){
    const sb = document.createElement('button');
    sb.id = 'sfx-toggle';
    sb.type = 'button';
    function updateSfx(){
      sb.innerHTML = SFX.sfxIsOn()
        ? '<span class="tico">🔊</span> <span class="tlbl">효과음<span class="tst"> ON</span></span>'
        : '<span class="tico">🔈</span> <span class="tlbl">효과음<span class="tst"> OFF</span></span>';
      sb.classList.toggle('off', !SFX.sfxIsOn());
    }
    updateSfx();
    sb.addEventListener('click', ()=>{ SFX.sfxToggle(); updateSfx(); });
    btn.parentNode.insertBefore(sb, btn.nextSibling);
  }
})();

// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 공용 내비게이션 (eq-nav.js)
// 모든 스테이지 우하단(퀘스트 버튼 위)에 "🗺 지도" 버튼 주입.
// ⚠ 좌측 하단 금지: 좌측 60%는 조이스틱 터치 캡처 영역이라 버튼 탭이 먹힌다.
// 누르면 현재 스테이지는 그대로 둔 채, 월드맵을 "모달(엿보기)"로 띄운다.
//  - ✕ 또는 바깥 클릭 → 닫고 스테이지로 복귀 (진행 유지!)
//  - 지도에서 스테이지 칸을 누르면 그때 비로소 이동(여행) — worldmap이 top 창을 이동
// ════════════════════════════════════════════════════════════
(function(){
  if (document.getElementById('eq-map-btn')) return;

  function openMap(){
    if (document.getElementById('eq-map-modal')) return;
    var ov = document.createElement('div');
    ov.id = 'eq-map-modal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;';
    var box = document.createElement('div');
    box.style.cssText = 'position:relative;width:min(680px,95vw);height:min(88vh,860px);background:#0a0e18;border:2px solid #2c3a58;border-radius:12px;overflow:hidden;box-shadow:0 12px 44px rgba(0,0,0,0.6);';
    var ifr = document.createElement('iframe');
    ifr.src = 'worldmap.html';
    ifr.style.cssText = 'width:100%;height:100%;border:0;display:block;';
    var x = document.createElement('button');
    x.textContent = '✕';
    x.title = '닫기 (스테이지로 돌아가기)';
    x.style.cssText = 'position:absolute;top:8px;right:8px;z-index:2;width:36px;height:36px;border-radius:50%;border:1px solid #44aaff;background:rgba(10,14,24,0.92);color:#7cc2ff;font-size:17px;cursor:pointer;line-height:1;';
    function close(){ var m=document.getElementById('eq-map-modal'); if(m) m.remove(); }
    x.addEventListener('click', close);
    ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
    document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown', esc); } });
    box.appendChild(ifr); box.appendChild(x); ov.appendChild(box);
    document.body.appendChild(ov);
  }

  function addBtn(){
    if (document.getElementById('eq-map-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'eq-map-btn';
    btn.type = 'button';
    btn.textContent = '🗺 지도';
    btn.style.cssText = [
      'position:fixed', 'right:10px', 'bottom:52px', 'z-index:300',
      'font-family:inherit', 'font-size:clamp(10px,1.3vw,14px)', 'letter-spacing:1px',
      'background:rgba(20,28,46,0.9)', 'color:#9fc2ff', 'border:1px solid #44aaff',
      'border-radius:6px', 'padding:6px 12px', 'cursor:pointer', 'pointer-events:all',
      'box-shadow:0 2px 10px rgba(0,0,0,0.45)', 'user-select:none', '-webkit-user-select:none'
    ].join(';');
    btn.addEventListener('click', openMap);
    document.body.appendChild(btn);
  }

  // ── 학습 등급: HUD의 의미없던 Lv/EXP를 "에너지 지식 등급"(도감 수집 기반)으로 대체 ──
  function setupRank(){
    var lv = document.getElementById('hud-lv');
    if(!lv) return;                              // HUD 없는 화면은 패스
    if(document.getElementById('eq-rank-box')) return;
    function g(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
    var stages=0, count=0;
    for(var i=1;i<=5;i++){ if(g('eq_stage'+i+'_cleared')==='1'){ stages++; count+=3; } }  // 스테이지당 도감 3장
    if(g('eq_stage6_cleared')==='1'){ stages++; count+=1; }                                // 피날레 1장
    var T=16;
    // DEC 경비병(스테이지)을 이길 때마다 등급 상승 — 클리어한 스테이지 수 기준
    var RANKS=['견습 공학자','수습 공학자','정식 공학자','숙련 공학자','전문 공학자','베테랑 공학자','에너지 마스터'];
    var rank = RANKS[Math.min(stages,6)];
    var lvLine = lv.parentNode;                  // "Lv.X  EXP y/z" 줄
    if(lvLine) lvLine.style.display='none';       // 숨김 (span은 남겨 updateHUD가 안 깨지게)
    var oldBar = document.getElementById('exp-bar-wrap');
    if(oldBar) oldBar.style.display='none';
    var host = (lvLine && lvLine.parentNode) || document.getElementById('hud-left');
    if(!host) return;
    var box = document.createElement('div');
    box.id = 'eq-rank-box';
    box.innerHTML =
      '<div style="color:#ffcc44;font-weight:bold;">🏅 '+rank+'</div>'+
      '<div style="font-size:9px;color:#9fb0c8;margin-top:1px;">📚 에너지 지식 '+count+'/'+T+'</div>'+
      '<div style="width:110px;height:6px;background:#1a1726;border-radius:3px;margin-top:2px;overflow:hidden;"><div style="height:100%;width:'+Math.round(count/T*100)+'%;background:linear-gradient(90deg,#ffcc44,#ff8800);"></div></div>';
    host.insertBefore(box, lvLine || host.firstChild);
  }

  // ── HUD 컴팩트 모드: 캔버스 좌우 여백이 좁으면 HUD를 축소해 맵 가림 최소화 ──
  // 일반 모드 우측 패널(기본 14px, eq-ui.css)의 실폭이 최대 ~400px이므로,
  // 여백이 410px 미만이면 compact, 80px 미만(모바일 등 캔버스가 화면을
  // 꽉 채움)이면 mini까지 적용.
  function setupHudCompact(){
    if(!document.getElementById('hud')) return;   // HUD 없는 화면은 패스
    function upd(){
      // 각 스테이지의 fit()이 캔버스 크기를 먼저 잡도록 한 박자 늦게 측정
      setTimeout(function(){
        var cv = document.getElementById('game-canvas');
        if(!cv) return;
        // 캔버스가 아직 크기를 못 받았으면 스테이지 화면비(960:704)로 추정
        var cw = cv.clientWidth || Math.min(window.innerWidth, window.innerHeight * (960/704));
        var margin = (window.innerWidth - cw) / 2;
        document.body.classList.toggle('eq-hud-compact', margin < 410);
        document.body.classList.toggle('eq-hud-mini',    margin < 80);
      }, 80);
    }
    // 컴팩트 모드에선 버튼이 아이콘만 보이므로 툴팁으로 이름을 보존
    var tips = { 'inv-toggle':'아이템 목록', 'bgm-toggle':'배경 음악 켜기/끄기', 'sfx-toggle':'효과음 켜기/끄기' };
    setTimeout(function(){
      for(var id in tips){ var b=document.getElementById(id); if(b && !b.title) b.title = tips[id]; }
    }, 300);
    window.addEventListener('resize', upd);
    window.addEventListener('orientationchange', upd);
    upd();
  }

  function init(){ addBtn(); setupRank(); setupHudCompact(); }
  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();

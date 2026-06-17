// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 공용 내비게이션 (eq-nav.js)
// 모든 스테이지 좌하단에 "🗺 지도" 버튼 주입.
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
      'position:fixed', 'left:10px', 'bottom:10px', 'z-index:300',
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

  function init(){ addBtn(); setupRank(); }
  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 공용 내비게이션 (eq-nav.js)
// 모든 스테이지 화면 좌하단에 "🗺 지도(월드맵)" 버튼을 주입한다.
// 한 곳만 고치면 전 스테이지에 반영. <script src="eq-nav.js"></script> 한 줄로 사용.
// ════════════════════════════════════════════════════════════
(function(){
  if (document.getElementById('eq-map-btn')) return;   // 중복 방지
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
    btn.addEventListener('click', function(){
      // 스테이지 도중 진행(이번 판에서 모은 부품 등)은 저장되지 않으므로 안내
      if (confirm('월드맵(에너지 여정)으로 나갈까요?\n진행 중인 스테이지는 처음부터 다시 하게 됩니다.\n(클리어한 스테이지 기록은 그대로 유지돼요)')){
        location.href = 'worldmap.html';
      }
    });
    document.body.appendChild(btn);
  }
  if (document.body) addBtn();
  else document.addEventListener('DOMContentLoaded', addBtn);
})();

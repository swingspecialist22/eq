// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 공용 화면 연출 오버레이 (eq-fx.js)
// 게임 캔버스 "위", HUD "아래"에 얇은 연출 레이어를 깔아 깊이감·분위기를 더한다.
//  - 비네팅(가장자리 어둡게) → 시선 집중 + 시네마틱
//  - 떠다니는 빛 입자(먼지/광원) → 살아있는 공간감
// 스테이지 렌더 코드는 건드리지 않음. #game-wrapper > #game-canvas 구조 필요.
// ════════════════════════════════════════════════════════════
(function(){
  function init(){
    var wrap = document.getElementById('game-wrapper');
    var canvas = document.getElementById('game-canvas');
    if(!wrap || !canvas || document.getElementById('eq-fx-layer')) return;

    // 1) 비네팅 + 은은한 상단 광 (캔버스 바로 위)
    var vig = document.createElement('div');
    vig.id = 'eq-fx-vignette';
    vig.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;'+
      'background:radial-gradient(ellipse at 50% 36%, rgba(255,250,235,0.06) 0%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.5) 100%);';
    canvas.parentNode.insertBefore(vig, canvas.nextSibling);

    // 2) 떠다니는 빛 입자 (비네팅 위)
    var fx = document.createElement('canvas');
    fx.id = 'eq-fx-layer';
    fx.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;';
    vig.parentNode.insertBefore(fx, vig.nextSibling);
    var ctx = fx.getContext('2d');

    var parts = [];
    function resize(){ fx.width = window.innerWidth || wrap.clientWidth || 800; fx.height = window.innerHeight || wrap.clientHeight || 600; }
    resize(); window.addEventListener('resize', resize);
    setTimeout(resize, 300);   // 레이아웃 확정 후 한 번 더
    for(var i=0;i<40;i++) parts.push({
      x:Math.random(), y:Math.random(),
      r:Math.random()*1.7+0.6,            // 크기
      s:Math.random()*0.00045+0.00015,    // 위로 떠오르는 속도
      drift:(Math.random()-0.5)*0.0003,   // 좌우 흔들림
      ph:Math.random()*6.283
    });
    (function loop(){
      ctx.clearRect(0,0,fx.width,fx.height);
      var t = Date.now()/1000;
      for(var i=0;i<parts.length;i++){
        var p = parts[i];
        p.y -= p.s; if(p.y < -0.03) p.y = 1.03;
        var x = (p.x + Math.sin(t*0.5 + p.ph)*0.01) * fx.width;
        var a = 0.16 + 0.24*((Math.sin(t*1.3 + p.ph)+1)/2);   // 반짝임
        ctx.fillStyle = 'rgba(255,240,200,'+a+')';
        ctx.beginPath(); ctx.arc(x, p.y*fx.height, p.r, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }
  if(document.getElementById('game-wrapper')) init();
  else window.addEventListener('DOMContentLoaded', init);
})();

// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 공용 캐릭터 일러스트(빌보드) 렌더 (eq-char.js)
// 방향별 치비 일러스트가 있으면 필드에서 픽셀 스프라이트 대신 빌보드로 그린다.
//   assets/char/char_<id>.png        = 정면 (아래로 이동)
//   assets/char/char_<id>_back.png   = 뒤통수 (위로 이동)
//   assets/char/char_<id>_side.png   = 옆모습 (오른쪽 기준; 왼쪽은 좌우반전)
// 해당 방향 그림이 없으면 정면으로 폴백, 정면도 없으면 false 반환 → 기존 픽셀 유지.
// 사용: drawPlayer 안의 그림자 직후
//   if(window.EQChar && EQChar.drawBillboard(ctx,charId,f,player.moving,fr,bx,by,TS)){ ctx.restore(); return; }
// ════════════════════════════════════════════════════════════
(function(){
  var IDS = ['haetsal','nari','nuri','saebyeok'];
  var VIEWS = [['front',''],['back','_back'],['side','_side']];
  var IMG = {};
  IDS.forEach(function(id){
    var set = {};
    VIEWS.forEach(function(v){
      var o = { img:new Image(), ready:false, failed:false, firstWait:0 };
      o.img.onload  = function(){ o.ready = true; };
      o.img.onerror = function(){ o.failed = true; };   // 그림 없음(404 등) → 픽셀 폴백
      o.img.src = 'assets/char/char_' + id + v[1] + '.png';
      set[v[0]] = o;
    });
    IMG[id] = set;
  });

  window.EQChar = {
    // 이 캐릭터의 정면 그림이 준비됐는가 (빌보드 사용 가능 여부)
    has: function(id){ var s = IMG[id]; return !!(s && s.front && s.front.ready); },
    // 빌보드를 그렸으면 true, 그릴 그림이 없으면 false. ctx 상태는 내부 save/restore로 보존.
    drawBillboard: function(ctx, charId, facing, moving, fr, bx, by, TS){
      var set = IMG[charId];
      if(!set || !set.front) return false;
      var front = set.front;
      if(!front.ready){
        // 정면 그림 로딩 중: 짧은 유예(800ms) 동안엔 픽셀 대신 비워둠(픽셀→치비 깜빡임 방지).
        // 그림이 없거나(404·실패) 유예를 넘기면 false 반환 → 호출부가 픽셀 스프라이트를 그림.
        if(front.failed) return false;
        if(!front.firstWait) front.firstWait = Date.now();
        return (Date.now() - front.firstWait) < 800;   // true=대기(픽셀 안 그림) · false=픽셀 폴백
      }
      var view = (facing === 'up') ? set.back
               : (facing === 'left' || facing === 'right') ? set.side
               : front;
      if(!view || !view.ready) view = front;       // 방향 그림 없으면 정면 폴백
      var bob = moving ? (fr % 2 === 0 ? -4 : 0) : 0;   // 걸을 때 통통
      var th  = TS * 1.30;                              // 키 ≈ 1.3타일
      var tw  = th * (view.img.width / view.img.height);
      var dx  = bx - tw / 2, dy = (by + 5) - th + bob;  // 가로 중앙·발은 타일 바닥
      ctx.save();
      ctx.imageSmoothingEnabled = true;                 // 치비는 부드럽게
      if(facing === 'left'){ ctx.translate(bx,0); ctx.scale(-1,1); ctx.translate(-bx,0); }
      ctx.drawImage(view.img, dx, dy, tw, th);
      ctx.restore();
      return true;
    }
  };
})();

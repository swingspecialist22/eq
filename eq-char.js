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
  var NPC_IMG = {};   // NPC는 방향 없이 정면 1장(assets/char/npc_<key>.png), key별 지연 로드
  IDS.forEach(function(id){
    var set = {};
    VIEWS.forEach(function(v){
      var o = { img:new Image(), ready:false, failed:false, firstWait:0, tries:0 };
      var url = 'assets/char/char_' + id + v[1] + '.png';
      o.img.onload  = function(){ o.ready = true; o.failed = false; };
      o.img.onerror = function(){ o.tries++; if(o.tries<=6){ setTimeout(function(){ o.img.src = url + '?r=' + o.tries; }, 500*o.tries); } else { o.failed = true; } };  // 일시적 404 재시도 후 픽셀 폴백
      o.img.src = url;
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
    },
    // NPC 빌보드: 정면 1장(assets/char/npc_<key>.png) 지연 로드. 그렸으면 true, 그림 없으면 false→픽셀.
    drawNPC: function(ctx, key, bx, by, TS){
      if(!key) return false;
      var o = NPC_IMG[key];
      if(!o){
        o = { img:new Image(), ready:false, failed:false, firstWait:0, tries:0 };
        var nurl = 'assets/char/npc_' + key + '.png';
        o.img.onload  = function(){ o.ready = true; o.failed = false; };
        o.img.onerror = function(){ o.tries++; if(o.tries<=6){ var oo=o; setTimeout(function(){ oo.img.src = nurl + '?r=' + oo.tries; }, 500*oo.tries); } else { o.failed = true; } };  // 일시적 404 재시도 후 픽셀 폴백
        o.img.src = nurl;
        NPC_IMG[key] = o;
      }
      if(!o.ready){
        if(o.failed) return false;
        if(!o.firstWait) o.firstWait = Date.now();
        return (Date.now() - o.firstWait) < 800;   // 로딩 중엔 픽셀 안 그림(깜빡임 방지)
      }
      var th = TS * 1.25;                               // NPC 키 ≈ 1.25타일
      var tw = th * (o.img.width / o.img.height);
      var dx = bx - tw / 2, dy = (by + 4) - th;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';              // 그림자
      ctx.beginPath(); ctx.ellipse(bx, by + 2, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(o.img, dx, dy, tw, th);
      ctx.restore();
      return true;
    },
    // ── 주민(엑스트라) 치비 — 시드 기반 프로시저럴, 항상 그려짐(true 반환) ──
    // seed: 정수(같은 주민은 항상 같은 모습), baseColor: 재킷색(스테이지 테마),
    // opts: {hair:0~4 고정, apron:true 앞치마, gray:true 흰머리}
    drawVillager: function(ctx, seed, bx, by, TS, baseColor, opts){
      opts = opts || {};
      function h(n){ var v = Math.sin((seed+1)*127.1 + n*311.7)*43758.5453; return v - Math.floor(v); }
      function hex2rgb(hx){ hx=(hx||'#7aa2d8').replace('#',''); if(hx.length===3)hx=hx[0]+hx[0]+hx[1]+hx[1]+hx[2]+hx[2]; var n=parseInt(hx,16); if(isNaN(n))n=0x7aa2d8; return [n>>16&255,n>>8&255,n&255]; }
      function sh(rgb,k){ return 'rgb('+Math.max(0,Math.min(255,Math.round(rgb[0]+k)))+','+Math.max(0,Math.min(255,Math.round(rgb[1]+k)))+','+Math.max(0,Math.min(255,Math.round(rgb[2]+k)))+')'; }
      var u = TS/56;
      var jr = hex2rgb(baseColor);
      var jacket = sh(jr,0), jDark = sh(jr,-46), jLight = sh(jr,36);
      var skins = ['#ffdcb8','#f8cba0','#edb98c'];
      var skin = skins[Math.floor(h(1)*3)], skinRGB = hex2rgb(skin);
      var hairs = ['#3a2a1c','#6a4526','#20222e','#8a5a24','#4a3a5a','#c0522e'];
      var hair = opts.gray ? '#c8c8cc' : hairs[Math.floor(h(2)*6)];
      var pants = ['#3a4a6a','#4a3a30','#3d3d47','#5a3a4a'][Math.floor(h(3)*4)];
      var style = (opts.hair!=null) ? opts.hair : Math.floor(h(4)*5);   // 0짧은머리 1단발 2포니테일 3모자 4쪽머리
      var bob = Math.sin(Date.now()/520 + seed)*1.1*u;                   // 살아있는 느낌
      var OUT = 'rgba(40,24,14,0.5)';
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.lineJoin = 'round';
      function rr(x,y,w,hh,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+hh,r); ctx.arcTo(x+w,y+hh,x,y+hh,r); ctx.arcTo(x,y+hh,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
      // 그림자
      ctx.fillStyle='rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(bx,by+2,11*u,4*u,0,0,6.283); ctx.fill();
      // 다리·신발 (몸통 아래로 보이게)
      ctx.fillStyle=pants;
      rr(bx-7*u,  by-10*u,5.6*u,9*u,2.4*u); ctx.fill();
      rr(bx+1.4*u,by-10*u,5.6*u,9*u,2.4*u); ctx.fill();
      ctx.fillStyle='#2a2430';
      rr(bx-8*u,  by-3.5*u,7.2*u,4.5*u,2*u); ctx.fill();
      rr(bx+0.8*u,by-3.5*u,7.2*u,4.5*u,2*u); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.25)';
      ctx.fillRect(bx-7*u,by-2.6*u,4.5*u,1.1*u); ctx.fillRect(bx+1.8*u,by-2.6*u,4.5*u,1.1*u);
      // 몸통(재킷) — 어깨 둥근 슬림 실루엣
      var tg=ctx.createLinearGradient(bx-9.5*u,0,bx+9.5*u,0);
      tg.addColorStop(0,jLight); tg.addColorStop(.55,jacket); tg.addColorStop(1,jDark);
      ctx.fillStyle=tg; rr(bx-9.5*u,by-26*u+bob,19*u,18*u,8*u); ctx.fill();
      ctx.strokeStyle=OUT; ctx.lineWidth=1.4*u;
      rr(bx-9.5*u,by-26*u+bob,19*u,18*u,8*u); ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=1.2*u;          // 밑단
      ctx.beginPath(); ctx.moveTo(bx-8*u,by-11.5*u+bob); ctx.lineTo(bx+8*u,by-11.5*u+bob); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1.2*u;    // 지퍼
      ctx.beginPath(); ctx.moveTo(bx,by-24*u+bob); ctx.lineTo(bx,by-11.5*u+bob); ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,0.22)'; ctx.lineWidth=1.1*u;          // 주머니
      ctx.beginPath(); ctx.moveTo(bx-6.5*u,by-15*u+bob); ctx.lineTo(bx-3.5*u,by-15*u+bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx+3.5*u,by-15*u+bob); ctx.lineTo(bx+6.5*u,by-15*u+bob); ctx.stroke();
      ctx.fillStyle=jDark; rr(bx-5*u,by-26.5*u+bob,10*u,3*u,1.5*u); ctx.fill();   // 깃
      if(h(9)>0.62 && !opts.apron){                                     // 목도리
        ctx.fillStyle=['#e86a5a','#e8b84a','#5ab8a0'][Math.floor(h(10)*3)];
        rr(bx-7*u,by-27.5*u+bob,14*u,4.2*u,2.1*u); ctx.fill();
        ctx.strokeStyle=OUT; ctx.lineWidth=1*u; rr(bx-7*u,by-27.5*u+bob,14*u,4.2*u,2.1*u); ctx.stroke();
      }
      if(opts.apron){                                                   // 앞치마
        ctx.fillStyle='#efe6cf'; rr(bx-6*u,by-17.5*u+bob,12*u,9.5*u,3*u); ctx.fill();
        ctx.strokeStyle='rgba(120,90,50,0.4)'; ctx.lineWidth=1*u;
        rr(bx-6*u,by-17.5*u+bob,12*u,9.5*u,3*u); ctx.stroke();
      }
      // 팔·손 (살짝 벌어진 자세)
      ctx.fillStyle=jacket;
      rr(bx-14.4*u,by-24*u+bob,5*u,12.5*u,2.5*u); ctx.fill();
      rr(bx+9.4*u, by-24*u+bob,5*u,12.5*u,2.5*u); ctx.fill();
      ctx.strokeStyle=OUT; ctx.lineWidth=1.1*u;
      rr(bx-14.4*u,by-24*u+bob,5*u,12.5*u,2.5*u); ctx.stroke();
      rr(bx+9.4*u, by-24*u+bob,5*u,12.5*u,2.5*u); ctx.stroke();
      ctx.fillStyle=skin;
      ctx.beginPath(); ctx.arc(bx-12*u,by-10.5*u+bob,2.5*u,0,6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(bx+12*u,by-10.5*u+bob,2.5*u,0,6.283); ctx.fill();
      // 머리 (큼직한 치비 비율)
      var hy=by-35.5*u+bob;
      var hg=ctx.createRadialGradient(bx-4*u,hy-4*u,2*u,bx,hy,13.5*u);
      hg.addColorStop(0,'#fff0de'); hg.addColorStop(.4,skin); hg.addColorStop(1,sh(skinRGB,-24));
      ctx.fillStyle=skin;
      ctx.beginPath(); ctx.arc(bx-12.8*u,hy+1.5*u,2.3*u,0,6.283); ctx.fill();  // 귀
      ctx.beginPath(); ctx.arc(bx+12.8*u,hy+1.5*u,2.3*u,0,6.283); ctx.fill();
      ctx.fillStyle=hg;
      ctx.beginPath(); ctx.ellipse(bx,hy,13.2*u,12.4*u,0,0,6.283); ctx.fill();
      ctx.strokeStyle=OUT; ctx.lineWidth=1.4*u;
      ctx.beginPath(); ctx.ellipse(bx,hy,13.2*u,12.4*u,0,0,6.283); ctx.stroke();
      // 헤어
      ctx.fillStyle=hair;
      if(style===0){        // 짧은 머리
        ctx.beginPath(); ctx.ellipse(bx,hy-4*u,13.5*u,9.6*u,0,Math.PI,0); ctx.fill();
        for(var k=-1;k<=1;k++){
          ctx.beginPath(); ctx.moveTo(bx+k*6*u-2*u,hy-12*u);
          ctx.lineTo(bx+k*6*u+1*u,hy-16.5*u); ctx.lineTo(bx+k*6*u+3.5*u,hy-12*u);
          ctx.closePath(); ctx.fill();
        }
      } else if(style===1){ // 단발
        ctx.beginPath(); ctx.ellipse(bx,hy-4*u,13.5*u,9.8*u,0,Math.PI,0); ctx.fill();
        rr(bx-14.2*u,hy-5*u,4.8*u,13.5*u,2.3*u); ctx.fill();
        rr(bx+9.4*u, hy-5*u,4.8*u,13.5*u,2.3*u); ctx.fill();
        ctx.beginPath(); ctx.ellipse(bx,hy-6.5*u,11*u,4.6*u,0,0,Math.PI); ctx.fill(); // 앞머리
      } else if(style===2){ // 포니테일
        ctx.beginPath(); ctx.ellipse(bx,hy-4*u,13.5*u,9.6*u,0,Math.PI,0); ctx.fill();
        ctx.beginPath(); ctx.arc(bx+9*u,hy-11*u,3.4*u,0,6.283); ctx.fill();
        ctx.strokeStyle=hair; ctx.lineCap='round'; ctx.lineWidth=4.4*u;
        ctx.beginPath(); ctx.moveTo(bx+10*u,hy-9*u);
        ctx.quadraticCurveTo(bx+16*u,hy-2*u,bx+13.5*u,hy+9*u); ctx.stroke();
        ctx.lineCap='butt';
        ctx.fillStyle='#e8b84a';
        ctx.beginPath(); ctx.arc(bx+9.2*u,hy-10.5*u,1.5*u,0,6.283); ctx.fill();
        ctx.fillStyle=hair;
      } else if(style===3){ // 야구모자
        ctx.beginPath(); ctx.ellipse(bx,hy-1*u,13.3*u,7.4*u,0,Math.PI,0); ctx.fill(); // 옆머리
        ctx.fillStyle=jDark;
        ctx.beginPath(); ctx.ellipse(bx,hy-5*u,12.9*u,9*u,0,Math.PI,0); ctx.fill();
        ctx.fillStyle=jacket;
        ctx.beginPath(); ctx.ellipse(bx,hy-5.5*u,12.9*u,8.4*u,0,Math.PI,0); ctx.fill();
        ctx.fillStyle=jDark;
        rr(bx-11.6*u,hy-7*u,23.2*u,3.4*u,1.7*u); ctx.fill();                          // 챙
        ctx.fillStyle='rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.arc(bx,hy-9.5*u,2*u,0,6.283); ctx.fill();              // 단추
      } else {              // 쪽머리(할머니·어머니)
        ctx.beginPath(); ctx.ellipse(bx,hy-4*u,13.4*u,9.4*u,0,Math.PI,0); ctx.fill();
        ctx.beginPath(); ctx.arc(bx,hy-13.5*u,4.4*u,0,6.283); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1*u;
        ctx.beginPath(); ctx.arc(bx,hy-13*u,2.4*u,0,6.283); ctx.stroke();
      }
      // 눈·눈썹·입·볼
      ctx.fillStyle='#241c18';
      ctx.beginPath(); ctx.ellipse(bx-4.6*u,hy+1.8*u,2.1*u,3*u,0,0,6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(bx+4.6*u,hy+1.8*u,2.1*u,3*u,0,0,6.283); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(bx-5.2*u,hy+0.8*u,0.85*u,0,6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(bx+4.0*u,hy+0.8*u,0.85*u,0,6.283); ctx.fill();
      ctx.strokeStyle='rgba(60,40,25,0.7)'; ctx.lineWidth=1.1*u;
      ctx.beginPath(); ctx.arc(bx-4.6*u,hy-1.4*u,2.8*u,Math.PI*1.18,Math.PI*1.82); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx+4.6*u,hy-1.4*u,2.8*u,Math.PI*1.18,Math.PI*1.82); ctx.stroke();
      ctx.strokeStyle='#a8543c'; ctx.lineWidth=1.3*u;
      ctx.beginPath(); ctx.arc(bx,hy+4.6*u,2.6*u,Math.PI*0.15,Math.PI*0.85); ctx.stroke();
      ctx.fillStyle='rgba(255,120,110,0.30)';
      ctx.beginPath(); ctx.arc(bx-8*u,hy+4.8*u,2*u,0,6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(bx+8*u,hy+4.8*u,2*u,0,6.283); ctx.fill();
      ctx.restore();
      return true;
    }
  };
})();

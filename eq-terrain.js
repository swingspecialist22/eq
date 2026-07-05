// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 공용 지형 프리렌더 모듈 (eq-terrain.js)
// 스테이지 2~6의 정적 지형을 오프스크린 캔버스에 "한 번만" 고품질로
// 그려두고, 게임 루프에서는 blit + 소수의 애니메이션 타일만 그린다.
// 사용법(각 스테이지, 캔버스 초기화 직후):
//   const TERRA = EQTerrain.init({stage:2, MAP,MAP_W,MAP_H,T,TS,RS,W,H});
// 게임 루프:
//   ctx.drawImage(TERRA.ground, cx*RS,cy*RS,W*RS,H*RS, 0,0,W,H);
//   TERRA.animTiles 순회하며 기존 drawTile 호출
//   TERRA.drawOverlays(ctx,cx,cy);   // 수면 반짝임 등
//   (플레이어 뒤) TERRA.drawAtmosphere(ctx);  // 라이팅·파티클
// ════════════════════════════════════════════════════════════
window.EQTerrain=(function(){
'use strict';

// ── 공용 헬퍼 ────────────────────────────────────────────
function h2(x,y){const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}
function rr(g,x,y,w,h,r){
  g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();
}
function shadow(g,x,y,rx,ry,a){
  const s=g.createRadialGradient(x,y,1,x,y,rx);
  s.addColorStop(0,'rgba(0,0,0,'+(a||0.3)+')');s.addColorStop(1,'rgba(0,0,0,0)');
  g.save();g.translate(x,y);g.scale(1,ry/rx);g.translate(-x,-y);
  g.fillStyle=s;g.beginPath();g.arc(x,y,rx,0,6.283);g.fill();g.restore();
}
function speck(g,x,y,s,n,col,aBase,aVar,sa,sb){
  for(let i=0;i<n;i++){
    g.fillStyle='rgba('+col+','+(aBase+h2(sa+i,sb)*aVar)+')';
    g.fillRect(x+3+h2(sa+i*7,sb+i)*(s-6),y+3+h2(sa+i,sb+i*11)*(s-6),1.6,1.6);
  }
}
// 어두운 금속(공용 DEC 구역)
function darkMetal(g,x,y,s,c,r,accent){
  g.fillStyle='#141020';g.fillRect(x,y,s,s);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    const px=x+2+j*(s/2),py=y+2+i*(s/2),pw=s/2-4;
    g.fillStyle=(i+j)%2?'#1a1528':'#1f1930';
    rr(g,px,py,pw,pw,4);g.fill();
    g.strokeStyle='rgba(90,80,140,0.25)';g.lineWidth=1;rr(g,px,py,pw,pw,4);g.stroke();
    g.fillStyle='#3c3560';
    g.fillRect(px+3,py+3,2,2);g.fillRect(px+pw-5,py+3,2,2);
    g.fillRect(px+3,py+pw-5,2,2);g.fillRect(px+pw-5,py+pw-5,2,2);
  }
  if(h2(c,r)>0.6){
    g.save();g.translate(x+s/2,y+s/2);g.rotate(-0.6);
    g.fillStyle='rgba('+(accent||'220,40,40')+',0.4)';
    g.fillRect(-12,-14,5,28);g.fillRect(7,-14,5,28);
    g.restore();
  }
}
// 나무 표지판(공용)
function woodSign(g,x,y,s,c,r){
  shadow(g,x+s/2+4,y+s-8,12,4,0.3);
  const pg=g.createLinearGradient(x+s/2-3,0,x+s/2+3,0);
  pg.addColorStop(0,'#8a5a28');pg.addColorStop(1,'#5f3a14');
  g.fillStyle=pg;g.fillRect(x+s/2-3,y+24,6,s-32);
  const bg=g.createLinearGradient(0,y+9,0,y+31);
  bg.addColorStop(0,'#c98f45');bg.addColorStop(1,'#a56f2e');
  g.fillStyle=bg;rr(g,x+8,y+8,s-16,24,4);g.fill();
  g.strokeStyle='#6e4315';g.lineWidth=1.5;rr(g,x+8,y+8,s-16,24,4);g.stroke();
  g.fillStyle='rgba(80,48,14,0.6)';
  g.fillRect(x+13,y+14,s-28,2.2);g.fillRect(x+13,y+23,s-34,2.2);
  g.fillStyle='rgba(255,220,150,0.3)';g.fillRect(x+10,y+9.5,s-20,2);
}

// ════════════════════════════════════════════════════════
// STAGE 2 — 바람의 해안 (늦은 오후 바닷가)
// ════════════════════════════════════════════════════════
function buildCoast(g,o){
  const{MAP,MAP_W,MAP_H,T,TS}=o;const s=TS;
  const at=(c,r)=>(c<0||r<0||c>=MAP_W||r>=MAP_H)?-1:MAP[r*MAP_W+c];
  const isLand=t=>t>=0&&t!==T.SEA&&t!==T.DOCK;
  const MW=MAP_W*s,MH=MAP_H*s;
  // ── 바다 전체(연속된 수면)
  let sg=g.createLinearGradient(0,0,0,MH);
  sg.addColorStop(0,'#5fb6d6');sg.addColorStop(.45,'#2b8ab4');sg.addColorStop(1,'#155f8c');
  g.fillStyle=sg;g.fillRect(0,0,MW,MH);
  for(let y=6;y<MH;y+=11){                       // 잔물결
    const ph=h2(5,y)*6.283,amp=2+h2(9,y)*2;
    g.beginPath();
    for(let x=0;x<=MW;x+=10){const yy=y+Math.sin(x*0.02+ph)*amp;x?g.lineTo(x,yy):g.moveTo(x,yy);}
    g.strokeStyle='rgba(220,245,255,'+(0.04+h2(3,y)*0.05)+')';g.lineWidth=1.6;g.stroke();
  }
  for(let i=0;i<140;i++){                        // 햇빛 반짝임
    g.fillStyle='rgba(235,250,255,'+(0.08+h2(i,51)*0.14)+')';
    g.fillRect(h2(i,52)*MW,h2(i,53)*MH,1.6,1.6);
  }
  // ── 타일별
  function sand(x,y,c,r){
    const pg=g.createLinearGradient(x,y,x,y+s);
    pg.addColorStop(0,'#eed9a2');pg.addColorStop(1,'#d9ba76');
    g.fillStyle=pg;g.fillRect(x,y,s,s);
    speck(g,x,y,s,5,'150,110,60',0.18,0.2,c*3,r*7);
    speck(g,x,y,s,4,'255,244,214',0.25,0.3,c*11,r*5);
    if(h2(c,r)>0.94){ // 조개
      const sx=x+10+h2(c,r*3)*(s-20),sy=y+10+h2(c*5,r)*(s-20);
      g.strokeStyle='rgba(250,240,225,0.85)';g.lineWidth=1.4;
      for(let k=0;k<3;k++){g.beginPath();g.arc(sx,sy+2,2+k*2,3.5,5.9);g.stroke();}
    }
    // 바다와 닿는 면 → 젖은 모래
    const wet='rgba(150,110,55,0.4)';
    if(at(c,r-1)===T.SEA){const w=g.createLinearGradient(0,y,0,y+10);w.addColorStop(0,wet);w.addColorStop(1,'rgba(150,110,55,0)');g.fillStyle=w;g.fillRect(x,y,s,10);}
    if(at(c,r+1)===T.SEA){const w=g.createLinearGradient(0,y+s,0,y+s-10);w.addColorStop(0,wet);w.addColorStop(1,'rgba(150,110,55,0)');g.fillStyle=w;g.fillRect(x,y+s-10,s,10);}
    if(at(c-1,r)===T.SEA){const w=g.createLinearGradient(x,0,x+10,0);w.addColorStop(0,wet);w.addColorStop(1,'rgba(150,110,55,0)');g.fillStyle=w;g.fillRect(x,y,10,s);}
    if(at(c+1,r)===T.SEA){const w=g.createLinearGradient(x+s,0,x+s-10,0);w.addColorStop(0,wet);w.addColorStop(1,'rgba(150,110,55,0)');g.fillStyle=w;g.fillRect(x+s-10,y,10,s);}
  }
  function grass(x,y,c,r){
    const pg=g.createLinearGradient(x,y,x,y+s);
    pg.addColorStop(0,'#57a54c');pg.addColorStop(1,'#3f8339');
    g.fillStyle=pg;g.fillRect(x,y,s,s);
    const b=g.createRadialGradient(x+s*h2(c,r),y+s*h2(r,c),2,x+s/2,y+s/2,s*0.8);
    b.addColorStop(0,'rgba(255,240,150,0.07)');b.addColorStop(1,'rgba(20,60,20,0.08)');
    g.fillStyle=b;g.fillRect(x,y,s,s);
    for(let i=0;i<7;i++){  // 풀잎
      const gx2=x+4+h2(c*7+i,r)*(s-8),gy=y+8+h2(c,r*5+i)*(s-12);
      g.strokeStyle=i%2?'rgba(36,90,34,0.6)':'rgba(120,200,110,0.55)';
      g.lineWidth=1.4;g.beginPath();g.moveTo(gx2,gy+5);
      g.quadraticCurveTo(gx2+(h2(i,c)-0.5)*4,gy,gx2+(h2(i,r)-0.5)*6,gy-4);g.stroke();
    }
    if(h2(c*3,r*5)>0.88){
      g.fillStyle=h2(c,r*9)>0.5?'#ffe9a8':'#ffb0c8';
      g.beginPath();g.arc(x+10+h2(c,r*2)*(s-20),y+10+h2(c*4,r)*(s-20),2.2,0,6.283);g.fill();
      g.fillStyle='#fff8e8';g.beginPath();g.arc(x+10+h2(c,r*2)*(s-20),y+10+h2(c*4,r)*(s-20),0.9,0,6.283);g.fill();
    }
  }
  function path(x,y,c,r){
    const pg=g.createLinearGradient(x,y,x,y+s);
    pg.addColorStop(0,'#ecd18f');pg.addColorStop(1,'#d8b46a');
    g.fillStyle=pg;rr(g,x+3,y+3,s-6,s-6,12);g.fill();
    g.fillStyle='#e2c37c';
    if(at(c+1,r)===T.PATH)g.fillRect(x+s-12,y+5,12,s-10);
    if(at(c-1,r)===T.PATH)g.fillRect(x,y+5,12,s-10);
    if(at(c,r+1)===T.PATH)g.fillRect(x+5,y+s-12,s-10,12);
    if(at(c,r-1)===T.PATH)g.fillRect(x+5,y,s-10,12);
    for(let i=0;i<6;i++){
      const a=h2(c*31+i,r*17)*6.283,rd=3+h2(c,r+i)*4;
      g.beginPath();g.arc(x+s/2+Math.cos(a)*(s/2-4),y+s/2+Math.sin(a)*(s/2-4),rd,0,6.283);g.fill();
    }
    speck(g,x,y,s,3,'150,105,50',0.3,0.25,c*9,r*3);
  }
  function cliff(x,y,c,r){
    const bands=['#a8845c','#93704b','#7f5f40','#6d4e34'];
    for(let i=0;i<4;i++){
      g.fillStyle=bands[i];
      const y0=y+i*(s/4);
      g.beginPath();g.moveTo(x,y0+Math.sin(c*3+i)*2);
      for(let px=0;px<=s;px+=8)g.lineTo(x+px,y0+Math.sin((c*s+px)*0.05+i*2)*2);
      g.lineTo(x+s,y0+s/4+4);g.lineTo(x,y0+s/4+4);g.closePath();g.fill();
    }
    g.strokeStyle='rgba(50,32,16,0.4)';g.lineWidth=1.2;
    for(let i=0;i<2;i++){
      let px=x+10+h2(c+i,r)*36,py=y+2;
      g.beginPath();g.moveTo(px,py);
      for(let k=0;k<3;k++){px+=(h2(c+k,r+i)-0.5)*10;py+=s/3;g.lineTo(px,py);}
      g.stroke();
    }
    if(at(c,r-1)!==T.CLIFF){g.fillStyle='rgba(230,200,150,0.5)';g.fillRect(x,y,s,3);}
    const sh=g.createLinearGradient(x,0,x+s,0);
    sh.addColorStop(0,'rgba(255,220,160,0.08)');sh.addColorStop(1,'rgba(20,10,30,0.15)');
    g.fillStyle=sh;g.fillRect(x,y,s,s);
  }
  function stoneWall(x,y,c,r){
    g.fillStyle='#7d7264';g.fillRect(x,y,s,s);
    for(let i=0;i<2;i++)for(let j=0;j<3;j++){
      const t2=0.85+h2(c*7+j,r*5+i)*0.3;
      const sx=x+2+j*(s/3)+(i%2?5:0),sy=y+3+i*(s/2),sw=s/3-4,sh2=s/2-6;
      g.fillStyle='rgb('+Math.round(178*t2)+','+Math.round(166*t2)+','+Math.round(140*t2)+')';
      rr(g,Math.min(sx,x+s-6),sy,Math.min(sw,x+s-2-sx),sh2,6);g.fill();
      g.strokeStyle='rgba(255,250,230,0.25)';g.lineWidth=1.2;
      g.beginPath();g.arc(Math.min(sx,x+s-6)+7,sy+6,5,3.4,5.2);g.stroke();
      if(h2(c+j,r+i)>0.85){g.fillStyle='rgba(95,143,74,0.5)';g.beginPath();g.arc(sx+sw*0.7,sy+sh2*0.8,2.5,0,6.283);g.fill();}
    }
    g.fillStyle='rgba(255,240,200,0.15)';g.fillRect(x,y,s,3);
    g.fillStyle='rgba(20,15,10,0.25)';g.fillRect(x,y+s-3,s,3);
  }
  function house(x,y,c,r){
    // 지붕(상단 26px)
    const rf=g.createLinearGradient(0,y,0,y+26);
    rf.addColorStop(0,'#cf7150');rf.addColorStop(1,'#aa5238');
    g.fillStyle=rf;g.fillRect(x,y,s,26);
    g.fillStyle='rgba(140,60,40,0.5)';
    for(let ry=6;ry<26;ry+=7)for(let rx2=((ry/7)%2)*7;rx2<s;rx2+=14){
      g.beginPath();g.arc(x+rx2+7,y+ry,7,0,Math.PI);g.stroke===g.stroke;g.fill();
    }
    g.fillStyle='rgba(255,220,180,0.35)';g.fillRect(x,y,s,3);
    // 벽(하단)
    const wl=g.createLinearGradient(0,y+26,0,y+s);
    wl.addColorStop(0,'#e6d0aa');wl.addColorStop(1,'#cdb086');
    g.fillStyle=wl;g.fillRect(x,y+26,s,s-26);
    g.strokeStyle='#7a5a34';g.lineWidth=2;
    g.strokeRect(x+1,y+26,s-2,s-27);
    g.beginPath();g.moveTo(x+1,y+26);g.lineTo(x+s-1,y+26);g.stroke();
    // 창문(따뜻한 불빛)
    const wx=x+s/2-9,wy=y+33;
    g.fillStyle='#6e4c28';g.fillRect(wx-2,wy-2,22,18);
    const wg2=g.createLinearGradient(0,wy,0,wy+14);
    wg2.addColorStop(0,'#ffe9b0');wg2.addColorStop(1,'#ffc25e');
    g.fillStyle=wg2;g.fillRect(wx,wy,18,14);
    g.strokeStyle='#6e4c28';g.lineWidth=1.6;
    g.beginPath();g.moveTo(wx+9,wy);g.lineTo(wx+9,wy+14);g.stroke();
    g.beginPath();g.moveTo(wx,wy+7);g.lineTo(wx+18,wy+7);g.stroke();
    g.fillStyle='rgba(255,225,150,0.18)';g.fillRect(wx-4,wy+14,26,8); // 새어나오는 빛
  }
  function dock(x,y,c,r){
    g.fillStyle='#0e3348';g.fillRect(x,y,s,s);   // 판자 틈 아래 물그림자
    for(let i=0;i<5;i++){
      const py=y+2+i*(s/5),t2=0.85+h2(c*5+i,r*3)*0.3;
      g.fillStyle='rgb('+Math.round(172*t2)+','+Math.round(122*t2)+','+Math.round(74*t2)+')';
      g.fillRect(x+1,py,s-2,s/5-3);
      g.strokeStyle='rgba(90,55,25,0.35)';g.lineWidth=1;
      g.beginPath();g.moveTo(x+4,py+s/10);g.lineTo(x+s-4,py+s/10);g.stroke();
      g.fillStyle='#503418';
      g.beginPath();g.arc(x+6,py+s/10,1.3,0,6.283);g.fill();
      g.beginPath();g.arc(x+s-6,py+s/10,1.3,0,6.283);g.fill();
    }
    if(at(c,r+1)===T.SEA||at(c+1,r)===T.SEA||at(c-1,r)===T.SEA){ // 말뚝
      g.fillStyle='#6e4a26';
      g.beginPath();g.arc(x+7,y+s-7,4,0,6.283);g.fill();
      g.beginPath();g.arc(x+s-7,y+s-7,4,0,6.283);g.fill();
      g.fillStyle='rgba(255,220,170,0.4)';
      g.beginPath();g.arc(x+6,y+s-8,1.6,0,6.283);g.fill();
      g.beginPath();g.arc(x+s-8,y+s-8,1.6,0,6.283);g.fill();
    }
  }
  // 그리기 순서: 바닥류 → 그림자 → 소품류
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    if(t===T.SAND)sand(x,y,c,r);
    else if(t===T.GRASS)grass(x,y,c,r);
    else if(t===T.PATH)path(x,y,c,r);
    else if(t===T.DOCK)dock(x,y,c,r);
    else if(t===T.PORTAL||t===T.SIGN)sand(x,y,c,r); // 애니메이션·소품 타일 밑바닥
  }
  // 물가 거품(바다 타일 쪽에)
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    if(MAP[r*MAP_W+c]!==T.SEA)continue;
    const x=c*s,y=r*s;
    const sides=[[0,-1,'u'],[0,1,'d'],[-1,0,'l'],[1,0,'r']];
    for(const[dc,dr,side]of sides){
      if(!isLand(at(c+dc,r+dr)))continue;
      g.save();
      const fw=9;
      let fx=x,fy=y,fw2=s,fh=fw,horiz=true;
      if(side==='u'){fy=y;}
      else if(side==='d'){fy=y+s-fw;}
      else{horiz=false;fw2=fw;fh=s;if(side==='r')fx=x+s-fw;}
      const fg2=horiz?g.createLinearGradient(0,side==='u'?fy:fy+fw,0,side==='u'?fy+fw:fy)
                     :g.createLinearGradient(side==='l'?fx+fw:fx,0,side==='l'?fx:fx+fw,0);
      fg2.addColorStop(0,'rgba(200,240,248,0)');fg2.addColorStop(1,'rgba(200,240,248,0.55)');
      g.fillStyle=fg2;g.fillRect(fx,fy,fw2,fh);
      // 물결선 거품
      g.strokeStyle='rgba(255,255,255,0.75)';g.lineWidth=1.8;g.beginPath();
      if(horiz){const yy=side==='u'?y+2:y+s-2;
        for(let px=0;px<=s;px+=6){const wob=Math.sin((c*s+px)*0.25+r)*1.5;px?g.lineTo(x+px,yy+wob):g.moveTo(x+px,yy+wob);}
      }else{const xx=side==='l'?x+2:x+s-2;
        for(let py=0;py<=s;py+=6){const wob=Math.sin((r*s+py)*0.25+c)*1.5;py?g.lineTo(xx+wob,y+py):g.moveTo(xx+wob,y+py);}
      }
      g.stroke();
      g.restore();
    }
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    if(t===T.CLIFF)cliff(x,y,c,r);
    else if(t===T.WALL)stoneWall(x,y,c,r);
    else if(t===T.HOUSE)house(x,y,c,r);
    else if(t===T.DEC)darkMetal(g,x,y,s,c,r);
  }
  // 구조물 아래 그림자
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c];
    if(t===T.WALL||t===T.HOUSE||t===T.CLIFF||t===T.DEC){
      const bt=at(c,r+1);
      if(bt===T.SAND||bt===T.PATH||bt===T.GRASS){
        const x=c*s,y=(r+1)*s;
        const sg2=g.createLinearGradient(0,y,0,y+12);
        sg2.addColorStop(0,'rgba(30,25,10,0.3)');sg2.addColorStop(1,'rgba(30,25,10,0)');
        g.fillStyle=sg2;g.fillRect(x,y,s,12);
      }
    }
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c];
    if(t===T.SIGN)woodSign(g,c*s,r*s,s,c,r);
  }
  return{
    anim:[T.PORTAL,T.TURB],
    overlay:{ids:[T.SEA],fn:function(ctx,sx,sy,c,r,ts){
      const t=Date.now()/1000;
      ctx.save();ctx.beginPath();ctx.rect(sx,sy,ts,ts);ctx.clip();
      for(let i=0;i<2;i++){
        const yy=sy+((t*7+i*26+c*13+r*31)%ts);
        ctx.fillStyle='rgba(220,245,255,0.09)';
        ctx.fillRect(sx+4+Math.sin(t*1.4+i+c)*4,yy,ts-8,1.8);
      }
      const sp=Math.sin(t*2.2+c*2.3+r*1.7);
      if(sp>0.88){
        const a=(sp-0.88)/0.12;
        const gxp=sx+8+h2(c,Math.floor(t))*(ts-16),gyp=sy+8+h2(r,Math.floor(t*1.2))*(ts-16);
        ctx.fillStyle='rgba(255,255,250,'+(a*0.8)+')';ctx.fillRect(gxp,gyp,2,2);
        ctx.fillStyle='rgba(255,255,250,'+(a*0.3)+')';ctx.fillRect(gxp-3,gyp,8,1);
      }
      ctx.restore();
    }},
    theme:{
      grade:['rgba(160,225,255,0.15)','rgba(10,40,90,0.18)'],
      bloom:{x:0.82,y:-0.06,r:0.5,col:'255,235,190',a:0.24},
      rays:{col:'215,240,255',a:0.05},
      pmode:'wind',pcol:'235,250,255',vig:0.20
    }
  };
}

// ════════════════════════════════════════════════════════
// STAGE 3 — 발명가의 도시 (보랏빛 저녁 + 네온)
// ════════════════════════════════════════════════════════
function buildCity(g,o){
  const{MAP,MAP_W,MAP_H,T,TS}=o;const s=TS;
  const at=(c,r)=>(c<0||r<0||c>=MAP_W||r>=MAP_H)?T.EMPTY:MAP[r*MAP_W+c];
  const MW=MAP_W*s,MH=MAP_H*s;
  // 도시 밤하늘/외곽
  let bg=g.createLinearGradient(0,0,0,MH);
  bg.addColorStop(0,'#161129');bg.addColorStop(1,'#1d1538');
  g.fillStyle=bg;g.fillRect(0,0,MW,MH);
  for(let i=0;i<3;i++){ // 네온 헤이즈
    const hx=h2(i,71)*MW,hy=h2(i,72)*MH;
    const hg=g.createRadialGradient(hx,hy,10,hx,hy,180+h2(i,73)*120);
    hg.addColorStop(0,i%2?'rgba(255,90,200,0.06)':'rgba(80,220,255,0.06)');hg.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=hg;g.fillRect(0,0,MW,MH);
  }
  function empty(x,y,c,r){ // 원경 건물 실루엣 + 불 켜진 창
    if(h2(c,r)<0.4)return;
    g.fillStyle='rgba(30,24,56,0.8)';
    const bh=14+h2(c*3,r)*30;
    g.fillRect(x+4,y+s-bh,s-8,bh);
    for(let i=0;i<6;i++){
      if(h2(c*7+i,r*5)<0.6)continue;
      g.fillStyle=h2(c+i,r)>0.5?'rgba(255,215,140,0.22)':'rgba(120,220,255,0.16)';
      g.fillRect(x+8+(i%3)*14,y+s-bh+5+Math.floor(i/3)*10,5,4);
    }
  }
  function floor(x,y,c,r){ // 광장 포장
    const t2=0.94+h2(c,r)*0.1;
    g.fillStyle='rgb('+Math.round(206*t2)+','+Math.round(210*t2)+','+Math.round(222*t2)+')';
    g.fillRect(x,y,s,s);
    g.strokeStyle='rgba(150,155,175,0.5)';g.lineWidth=1;
    g.strokeRect(x+0.5,y+0.5,s-1,s-1);
    g.fillStyle='rgba(255,255,255,0.16)';g.fillRect(x+1,y+1,s-2,2);
    g.fillStyle='rgba(90,95,120,0.12)';g.fillRect(x+1,y+s-3,s-2,2);
    speck(g,x,y,s,3,'120,126,150',0.12,0.15,c*13,r*7);
    if(h2(c*5,r*9)>0.95){ // 맨홀
      g.fillStyle='#8a90a2';g.beginPath();g.arc(x+s/2,y+s/2,8,0,6.283);g.fill();
      g.strokeStyle='#5f6478';g.lineWidth=1.4;
      g.beginPath();g.arc(x+s/2,y+s/2,8,0,6.283);g.stroke();
      g.beginPath();g.arc(x+s/2,y+s/2,4.5,0,6.283);g.stroke();
    }
  }
  function road(x,y,c,r){
    g.fillStyle='#363b47';g.fillRect(x,y,s,s);
    speck(g,x,y,s,6,'200,205,220',0.05,0.08,c*3,r*11);
    speck(g,x,y,s,4,'10,12,18',0.2,0.2,c*7,r*13);
    const hR=at(c+1,r)===T.ROAD||at(c-1,r)===T.ROAD;
    const vR=at(c,r+1)===T.ROAD||at(c,r-1)===T.ROAD;
    g.fillStyle='rgba(232,208,90,0.75)';
    if(hR&&!vR){for(let px=4;px<s;px+=16)g.fillRect(x+px,y+s/2-1.5,8,3);}
    else if(vR&&!hR){for(let py=4;py<s;py+=16)g.fillRect(x+s/2-1.5,y+py,3,8);}
    else{g.fillStyle='rgba(232,208,90,0.35)';
      g.fillRect(x+4,y+4,3,3);g.fillRect(x+s-7,y+4,3,3);g.fillRect(x+4,y+s-7,3,3);g.fillRect(x+s-7,y+s-7,3,3);}
    // 연석
    if(at(c,r-1)===T.FLOOR){g.fillStyle='rgba(220,224,235,0.5)';g.fillRect(x,y,s,2.5);}
    if(at(c,r+1)===T.FLOOR){g.fillStyle='rgba(220,224,235,0.5)';g.fillRect(x,y+s-2.5,s,2.5);}
    if(at(c-1,r)===T.FLOOR){g.fillStyle='rgba(220,224,235,0.5)';g.fillRect(x,y,2.5,s);}
    if(at(c+1,r)===T.FLOOR){g.fillStyle='rgba(220,224,235,0.5)';g.fillRect(x+s-2.5,y,2.5,s);}
  }
  function wall(x,y,c,r){ // 건물 파사드 + 창
    const t2=0.9+h2(c*3,r*5)*0.16;
    g.fillStyle='rgb('+Math.round(148*t2)+','+Math.round(152*t2)+','+Math.round(176*t2)+')';
    g.fillRect(x,y,s,s);
    g.fillStyle='rgba(255,255,255,0.12)';g.fillRect(x,y,s,3);
    g.fillStyle='rgba(20,22,40,0.2)';g.fillRect(x,y+s-3,s,3);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++){
      const wx=x+7+j*(s/2-2),wy=y+8+i*(s/2-2),ww=s/2-14,wh=s/2-16;
      g.fillStyle='#63687f';g.fillRect(wx-1.5,wy-1.5,ww+3,wh+3);
      if(h2(c*7+j,r*9+i)>0.45){
        const lw=g.createLinearGradient(0,wy,0,wy+wh);
        lw.addColorStop(0,'#ffe4a0');lw.addColorStop(1,'#f8b95e');
        g.fillStyle=lw;g.fillRect(wx,wy,ww,wh);
        g.fillStyle='rgba(255,255,255,0.35)';g.fillRect(wx,wy,ww,2);
      }else{
        g.fillStyle='#242940';g.fillRect(wx,wy,ww,wh);
        g.strokeStyle='rgba(180,210,255,0.25)';g.lineWidth=1.4;
        g.beginPath();g.moveTo(wx+1,wy+wh-2);g.lineTo(wx+ww-2,wy+1);g.stroke();
      }
    }
  }
  function roof(x,y,c,r){
    g.fillStyle='#5f6478';g.fillRect(x,y,s,s);
    speck(g,x,y,s,8,'160,166,188',0.08,0.1,c*17,r*3);
    if(at(c,r-1)!==T.ROOF){g.fillStyle='#7d8398';g.fillRect(x,y,s,4);}
    if(at(c-1,r)!==T.ROOF){g.fillStyle='rgba(125,131,152,0.7)';g.fillRect(x,y,3,s);}
    if(h2(c,r)>0.55){ // 실외기
      g.fillStyle='#8f96ac';rr(g,x+s/2-11,y+s/2-8,22,17,3);g.fill();
      g.fillStyle='#4a4f64';g.beginPath();g.arc(x+s/2-3,y+s/2,5.5,0,6.283);g.fill();
      g.strokeStyle='#7d8398';g.lineWidth=1.2;
      g.beginPath();g.moveTo(x+s/2-3,y+s/2-5);g.lineTo(x+s/2-3,y+s/2+5);g.stroke();
      g.beginPath();g.moveTo(x+s/2-8,y+s/2);g.lineTo(x+s/2+2,y+s/2);g.stroke();
      g.fillStyle='#31364a';g.fillRect(x+s/2+3,y+s/2-5,5,10);
      shadow(g,x+s/2,y+s/2+11,13,3.5,0.25);
    }
  }
  function door(x,y,c,r){
    g.fillStyle='#7d8398';g.fillRect(x,y,s,s);
    // 어닝
    for(let i=0;i<4;i++){g.fillStyle=i%2?'#e8e8f0':'#d0506a';g.fillRect(x+4+i*(s-8)/4,y+4,(s-8)/4,9);}
    g.fillStyle='rgba(0,0,0,0.2)';g.fillRect(x+4,y+13,s-8,2);
    // 유리문
    const dg=g.createLinearGradient(0,y+17,0,y+s-6);
    dg.addColorStop(0,'#232c46');dg.addColorStop(1,'#2f3c5e');
    g.fillStyle=dg;g.fillRect(x+10,y+17,s-20,s-23);
    g.strokeStyle='#a8aec2';g.lineWidth=2;g.strokeRect(x+10,y+17,s-20,s-23);
    g.beginPath();g.moveTo(x+s/2,y+17);g.lineTo(x+s/2,y+s-6);g.stroke();
    const glow=g.createRadialGradient(x+s/2,y+s-8,2,x+s/2,y+s-8,16);
    glow.addColorStop(0,'rgba(255,220,150,0.35)');glow.addColorStop(1,'rgba(255,220,150,0)');
    g.fillStyle=glow;g.fillRect(x+6,y+s-20,s-12,16);
  }
  function neonSign(x,y,c,r){
    g.fillStyle='#101426';rr(g,x+6,y+8,s-12,s-20,5);g.fill();
    g.strokeStyle='rgba(82,232,255,0.8)';g.lineWidth=2;rr(g,x+6,y+8,s-12,s-20,5);g.stroke();
    g.strokeStyle='rgba(82,232,255,0.25)';g.lineWidth=5;rr(g,x+6,y+8,s-12,s-20,5);g.stroke();
    g.fillStyle='rgba(82,232,255,0.85)';g.fillRect(x+12,y+16,s-26,3);
    g.fillStyle='rgba(255,106,213,0.85)';g.fillRect(x+12,y+25,s-32,3);
    g.fillStyle='rgba(255,255,255,0.5)';g.fillRect(x+12,y+16,4,3);
  }
  function construct(x,y,c,r){
    g.fillStyle='#6e5f44';g.fillRect(x,y,s,s);
    speck(g,x,y,s,6,'40,32,20',0.2,0.2,c*3,r*17);
    // 바리케이드
    g.fillStyle='#4a3a22';g.fillRect(x+6,y+s-22,4,16);g.fillRect(x+s-10,y+s-22,4,16);
    for(let i=0;i<5;i++){g.fillStyle=i%2?'#ff9a2a':'#f0ead8';
      g.save();g.beginPath();g.rect(x+4,y+s-30,s-8,9);g.clip();
      g.translate(x+4+i*(s-8)/5,y+s-30);g.rotate(0.35);g.fillRect(0,-4,(s-8)/5,18);g.restore();}
    g.strokeStyle='#2a2216';g.lineWidth=1;g.strokeRect(x+4,y+s-30,s-8,9);
    // 콘
    g.fillStyle='#ff8825';g.beginPath();g.moveTo(x+s-16,y+12);g.lineTo(x+s-22,y+28);g.lineTo(x+s-10,y+28);g.closePath();g.fill();
    g.fillStyle='#fff2e0';g.fillRect(x+s-20,y+20,8,3);
    shadow(g,x+s-16,y+29,8,2.5,0.3);
  }
  function exhibit(x,y,c,r){
    floor(x,y,c,r);
    shadow(g,x+s/2,y+s-12,15,4,0.28);
    const pd=g.createLinearGradient(0,y+s-26,0,y+s-10);
    pd.addColorStop(0,'#d4d9e4');pd.addColorStop(1,'#a9aec0');
    g.fillStyle=pd;rr(g,x+s/2-13,y+s-26,26,15,3);g.fill();
    const dome=g.createRadialGradient(x+s/2-3,y+s/2-8,2,x+s/2,y+s/2-4,16);
    dome.addColorStop(0,'rgba(200,240,255,0.35)');dome.addColorStop(1,'rgba(140,220,255,0.12)');
    g.fillStyle=dome;g.beginPath();g.arc(x+s/2,y+s-24,13,Math.PI,0);g.closePath();g.fill();
    g.strokeStyle='rgba(190,235,255,0.5)';g.lineWidth=1.4;
    g.beginPath();g.arc(x+s/2,y+s-24,13,Math.PI,0);g.stroke();
    g.strokeStyle='rgba(255,255,255,0.6)';
    g.beginPath();g.arc(x+s/2-4,y+s-27,8,3.6,4.6);g.stroke();
    g.fillStyle='rgba(120,220,255,0.5)';g.beginPath();g.arc(x+s/2,y+s-28,3,0,6.283);g.fill();
  }
  function indoor(x,y,c,r){
    for(let i=0;i<4;i++){
      const t2=0.88+h2(c*3+i,r*7)*0.22;
      g.fillStyle='rgb('+Math.round(185*t2)+','+Math.round(137*t2)+','+Math.round(86*t2)+')';
      g.fillRect(x,y+i*(s/4),s,s/4);
      g.strokeStyle='rgba(90,55,25,0.35)';g.lineWidth=1;
      g.beginPath();g.moveTo(x,y+i*(s/4));g.lineTo(x+s,y+i*(s/4));g.stroke();
      const off=h2(c+i,r)*s;
      g.beginPath();g.moveTo(x+off,y+i*(s/4));g.lineTo(x+off,y+(i+1)*(s/4));g.stroke();
    }
    const lt=g.createRadialGradient(x+s/2,y+s/2,4,x+s/2,y+s/2,s*0.75);
    lt.addColorStop(0,'rgba(255,225,160,0.15)');lt.addColorStop(1,'rgba(60,30,10,0.12)');
    g.fillStyle=lt;g.fillRect(x,y,s,s);
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    switch(t){
      case T.EMPTY:empty(x,y,c,r);break;
      case T.FLOOR:floor(x,y,c,r);break;
      case T.PORTAL:floor(x,y,c,r);break;
      case T.ROAD:road(x,y,c,r);break;
      case T.INDOOR:indoor(x,y,c,r);break;
      case T.CONSTRUCT:construct(x,y,c,r);break;
      case T.EXHIBIT:exhibit(x,y,c,r);break;
      case T.DEC:darkMetal(g,x,y,s,c,r);break;
    }
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    switch(t){
      case T.WALL:wall(x,y,c,r);break;
      case T.ROOF:roof(x,y,c,r);break;
      case T.DOOR:door(x,y,c,r);break;
      case T.SIGN:neonSign(x,y,c,r);break;
    }
  }
  // 건물 그림자
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c];
    if(t===T.WALL||t===T.ROOF||t===T.DEC){
      const bt=at(c,r+1);
      if(bt===T.FLOOR||bt===T.ROAD||bt===T.INDOOR){
        const x=c*s,y=(r+1)*s;
        const sg2=g.createLinearGradient(0,y,0,y+13);
        sg2.addColorStop(0,'rgba(10,10,30,0.35)');sg2.addColorStop(1,'rgba(10,10,30,0)');
        g.fillStyle=sg2;g.fillRect(x,y,s,13);
      }
    }
  }
  return{
    anim:[T.PORTAL],
    theme:{
      grade:['rgba(255,160,230,0.10)','rgba(30,20,80,0.22)'],
      bloom:{x:0.5,y:-0.12,r:0.6,col:'200,150,255',a:0.13},
      pmode:'motes',pcol:'195,175,255',vig:0.24
    }
  };
}

// ════════════════════════════════════════════════════════
// STAGE 4 — 공장 던전 (용광로의 열기)
// ════════════════════════════════════════════════════════
function buildFactory(g,o){
  const{MAP,MAP_W,MAP_H,T,TS}=o;const s=TS;
  const at=(c,r)=>(c<0||r<0||c>=MAP_W||r>=MAP_H)?T.EMPTY:MAP[r*MAP_W+c];
  const MW=MAP_W*s,MH=MAP_H*s;
  g.fillStyle='#070503';g.fillRect(0,0,MW,MH);
  const eb=g.createLinearGradient(0,MH*0.55,0,MH);
  eb.addColorStop(0,'rgba(255,90,20,0)');eb.addColorStop(1,'rgba(255,90,20,0.07)');
  g.fillStyle=eb;g.fillRect(0,0,MW,MH);
  function floor(x,y,c,r){
    const t2=0.9+h2(c,r)*0.18;
    g.fillStyle='rgb('+Math.round(104*t2)+','+Math.round(99*t2)+','+Math.round(89*t2)+')';
    g.fillRect(x,y,s,s);
    g.strokeStyle='rgba(35,32,26,0.4)';g.lineWidth=1;g.strokeRect(x+0.5,y+0.5,s-1,s-1);
    speck(g,x,y,s,5,'40,36,28',0.15,0.2,c*7,r*3);
    if(h2(c*3,r)>0.5){ // 균열
      g.strokeStyle='rgba(30,28,22,0.5)';g.lineWidth=1.1;
      let px=x+6+h2(c,r*7)*(s-16),py=y+4;
      g.beginPath();g.moveTo(px,py);
      for(let k=0;k<3;k++){px+=(h2(c+k,r)-0.5)*12;py+=s/3;g.lineTo(px,py);}
      g.stroke();
    }
    if(h2(c*9,r*5)>0.82){ // 기름때
      const og=g.createRadialGradient(x+s/2,y+s/2,2,x+s/2,y+s/2,12+h2(c,r*3)*8);
      og.addColorStop(0,'rgba(15,13,10,0.4)');og.addColorStop(1,'rgba(15,13,10,0)');
      g.fillStyle=og;g.fillRect(x,y,s,s);
    }
  }
  function metal(x,y,c,r){
    const t2=0.92+h2(c*5,r*3)*0.16;
    g.fillStyle='rgb('+Math.round(119*t2)+','+Math.round(128*t2)+','+Math.round(144*t2)+')';
    g.fillRect(x,y,s,s);
    for(let py=5;py<s;py+=10)for(let px=((py/10)%2)*7+4;px<s-4;px+=14){ // 다이아 플레이트
      g.fillStyle='rgba(255,255,255,0.12)';
      g.save();g.translate(x+px,y+py);g.rotate(0.785);g.fillRect(-3,-1,6,2);g.restore();
      g.fillStyle='rgba(0,0,0,0.15)';
      g.save();g.translate(x+px+1,y+py+1);g.rotate(0.785);g.fillRect(-3,-1,6,2);g.restore();
    }
    g.strokeStyle='rgba(40,44,54,0.55)';g.lineWidth=1.4;g.strokeRect(x+1,y+1,s-2,s-2);
    g.fillStyle='#31364a';
    g.fillRect(x+4,y+4,2.4,2.4);g.fillRect(x+s-7,y+4,2.4,2.4);
    g.fillRect(x+4,y+s-7,2.4,2.4);g.fillRect(x+s-7,y+s-7,2.4,2.4);
  }
  function wall(x,y,c,r){
    g.fillStyle='#41454f';g.fillRect(x,y,s,s);
    g.fillStyle='#4c515c';rr(g,x+3,y+3,s-6,s-6,3);g.fill();
    g.fillStyle='rgba(255,255,255,0.08)';g.fillRect(x+3,y+3,s-6,2.4);
    g.fillStyle='rgba(0,0,0,0.22)';g.fillRect(x+3,y+s-6,s-6,3);
    g.strokeStyle='rgba(25,27,33,0.6)';g.lineWidth=1.2;
    g.beginPath();g.moveTo(x+3,y+s/2);g.lineTo(x+s-3,y+s/2);g.stroke();
    g.fillStyle='#23262e';
    for(const[bx,by]of[[7,7],[s-9,7],[7,s-9],[s-9,s-9],[s/2,7],[s/2,s-9]])
      {g.beginPath();g.arc(x+bx,y+by,1.7,0,6.283);g.fill();
       g.fillStyle='rgba(255,255,255,0.25)';g.fillRect(x+bx-1.6,y+by-1.6,1.2,1.2);g.fillStyle='#23262e';}
    if(h2(c,r*3)>0.55){ // 녹물
      const rx=x+8+h2(c*7,r)*(s-16);
      const rs2=g.createLinearGradient(0,y+3,0,y+3+14+h2(c,r)*20);
      rs2.addColorStop(0,'rgba(180,90,32,0.4)');rs2.addColorStop(1,'rgba(180,90,32,0)');
      g.fillStyle=rs2;g.fillRect(rx,y+3,3,14+h2(c,r)*20);
    }
  }
  function pipe(x,y,c,r){
    g.fillStyle='#14100a';g.fillRect(x,y,s,s);
    const horiz=at(c-1,r)===T.PIPE||at(c+1,r)===T.PIPE;
    if(horiz){
      const pg=g.createLinearGradient(0,y+s/2-13,0,y+s/2+13);
      pg.addColorStop(0,'#565c6a');pg.addColorStop(.3,'#98a0b2');pg.addColorStop(.55,'#788093');pg.addColorStop(1,'#3a3f4b');
      g.fillStyle=pg;g.fillRect(x,y+s/2-13,s,26);
      g.fillStyle='#2f333d';g.fillRect(x+2,y+s/2-15,6,30);g.fillRect(x+s-8,y+s/2-15,6,30);
      g.fillStyle='rgba(255,255,255,0.18)';g.fillRect(x,y+s/2-10,s,2.5);
    }else{
      const pg=g.createLinearGradient(x+s/2-13,0,x+s/2+13,0);
      pg.addColorStop(0,'#565c6a');pg.addColorStop(.3,'#98a0b2');pg.addColorStop(.55,'#788093');pg.addColorStop(1,'#3a3f4b');
      g.fillStyle=pg;g.fillRect(x+s/2-13,y,26,s);
      g.fillStyle='#2f333d';g.fillRect(x+s/2-15,y+2,30,6);g.fillRect(x+s/2-15,y+s-8,30,6);
      g.fillStyle='rgba(255,255,255,0.18)';g.fillRect(x+s/2-10,y,2.5,s);
    }
    if(h2(c,r)>0.7){ // 밸브
      g.fillStyle='#c8452a';g.beginPath();g.arc(x+s/2,y+s/2,6.5,0,6.283);g.fill();
      g.strokeStyle='#8a2c18';g.lineWidth=2;
      g.beginPath();g.moveTo(x+s/2-6,y+s/2);g.lineTo(x+s/2+6,y+s/2);g.stroke();
      g.beginPath();g.moveTo(x+s/2,y+s/2-6);g.lineTo(x+s/2,y+s/2+6);g.stroke();
    }
  }
  function door(x,y,c,r){
    for(let i=0;i<7;i++){ // 위험 프레임
      g.fillStyle=i%2?'#e8c23c':'#1c1a14';
      g.fillRect(x+i*(s/7),y,s/7,5);g.fillRect(x+i*(s/7),y+s-5,s/7,5);
    }
    g.fillStyle='#2c2f38';g.fillRect(x+3,y+5,s-6,s-10);
    g.strokeStyle='#15171d';g.lineWidth=2;
    g.beginPath();g.moveTo(x+s/2,y+5);g.lineTo(x+s/2,y+s-5);g.stroke();
    g.fillStyle='rgba(255,202,106,0.8)';g.fillRect(x+s/2-8,y+s/2-3,16,4);
    g.fillStyle='rgba(255,202,106,0.2)';g.fillRect(x+s/2-11,y+s/2-6,22,10);
    g.fillStyle='rgba(255,255,255,0.07)';g.fillRect(x+3,y+5,s-6,2);
  }
  function caution(x,y,c,r){
    floor(x,y,c,r);
    g.save();g.beginPath();g.rect(x+3,y+3,s-6,7);g.rect(x+3,y+s-10,s-6,7);g.clip();
    for(let i=-1;i<8;i++){
      g.fillStyle=i%2?'#e8c23c':'#26221a';
      g.save();g.translate(x+i*10,y);g.rotate(0.6);g.fillRect(0,-6,7,s+14);g.restore();
    }
    g.restore();
    g.strokeStyle='rgba(20,18,12,0.5)';g.lineWidth=1;
    g.strokeRect(x+3,y+3,s-6,7);g.strokeRect(x+3,y+s-10,s-6,7);
  }
  function dark(x,y,c,r){
    g.fillStyle='#0b0906';g.fillRect(x,y,s,s);
    g.fillStyle='rgba(120,150,255,0.04)';g.fillRect(x,y,s,4);
  }
  function rust(x,y,c,r){
    g.fillStyle='#6a4c34';g.fillRect(x,y,s,s);
    for(let i=0;i<4;i++){
      const rx=x+h2(c*3+i,r)*s,ry=y+h2(c,r*5+i)*s;
      const rg2=g.createRadialGradient(rx,ry,1,rx,ry,7+h2(i,c)*9);
      rg2.addColorStop(0,i%2?'rgba(150,92,44,0.5)':'rgba(74,44,26,0.5)');rg2.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=rg2;g.fillRect(x,y,s,s);
    }
    g.strokeStyle='rgba(40,26,16,0.5)';g.lineWidth=1.3;g.strokeRect(x+1,y+1,s-2,s-2);
    g.fillStyle='#3a281a';
    g.fillRect(x+4,y+4,2.2,2.2);g.fillRect(x+s-7,y+4,2.2,2.2);
    g.fillRect(x+4,y+s-7,2.2,2.2);g.fillRect(x+s-7,y+s-7,2.2,2.2);
    g.strokeStyle='rgba(255,190,120,0.12)';g.lineWidth=1.6;
    g.beginPath();g.arc(x+s/2,y+s/2,s/3,3.4,4.6);g.stroke();
  }
  function station(x,y,c,r){
    g.fillStyle='#23262e';g.fillRect(x,y,s,s);
    g.strokeStyle='rgba(90,96,116,0.3)';g.lineWidth=1;g.strokeRect(x+2,y+2,s-4,s-4);
    shadow(g,x+s/2,y+s-10,16,4,0.3);
    const cs=g.createLinearGradient(0,y+10,0,y+s-12);
    cs.addColorStop(0,'#454b5c');cs.addColorStop(1,'#33384a');
    g.fillStyle=cs;rr(g,x+9,y+10,s-18,s-22,4);g.fill();
    g.fillStyle='#0a2432';g.fillRect(x+13,y+15,s-26,12);
    g.fillStyle='rgba(106,223,255,0.85)';
    g.fillRect(x+15,y+18,s-34,2.2);g.fillRect(x+15,y+22,s-40,2.2);
    g.fillStyle='#e84c3c';g.beginPath();g.arc(x+16,y+s-18,2.2,0,6.283);g.fill();
    g.fillStyle='#4ade80';g.beginPath();g.arc(x+23,y+s-18,2.2,0,6.283);g.fill();
    g.fillStyle='#e8c23c';g.beginPath();g.arc(x+30,y+s-18,2.2,0,6.283);g.fill();
    g.fillStyle='rgba(255,255,255,0.1)';g.fillRect(x+9,y+10,s-18,2.4);
  }
  function gate(x,y,c,r){
    metal(x,y,c,r);
    g.fillStyle='rgba(255,190,60,0.5)';g.fillRect(x+4,y+s/2-2.5,s-8,5);
    g.fillStyle='rgba(255,190,60,0.15)';g.fillRect(x+4,y+s/2-6,s-8,12);
    g.fillStyle='#1c1e26';
    g.fillRect(x+2,y+s/2-4,4,8);g.fillRect(x+s-6,y+s/2-4,4,8);
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    switch(t){
      case T.EMPTY:break;
      case T.FLOOR:floor(x,y,c,r);break;
      case T.PORTAL:floor(x,y,c,r);break;
      case T.METAL:metal(x,y,c,r);break;
      case T.WALL:wall(x,y,c,r);break;
      case T.PIPE:pipe(x,y,c,r);break;
      case T.DOOR:door(x,y,c,r);break;
      case T.CAUTION:caution(x,y,c,r);break;
      case T.DARK:dark(x,y,c,r);break;
      case T.RUST:rust(x,y,c,r);break;
      case T.STATION:station(x,y,c,r);break;
      case T.GATE:gate(x,y,c,r);break;
    }
  }
  // 벽 그림자
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c];
    if(t===T.WALL||t===T.PIPE){
      const bt=at(c,r+1);
      if(bt===T.FLOOR||bt===T.METAL||bt===T.CAUTION||bt===T.RUST){
        const x=c*s,y=(r+1)*s;
        const sg2=g.createLinearGradient(0,y,0,y+12);
        sg2.addColorStop(0,'rgba(0,0,0,0.4)');sg2.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle=sg2;g.fillRect(x,y,s,12);
      }
    }
  }
  return{
    anim:[T.PORTAL,T.CONVEYOR,T.MACHINE],
    theme:{
      grade:['rgba(255,150,70,0.15)','rgba(20,8,8,0.28)'],
      bottomGlow:{col:'255,110,30',a:0.15},
      pmode:'embers',pcol:'255,150,60',haze:true,vig:0.30
    }
  };
}

// ════════════════════════════════════════════════════════
// STAGE 5 — 데이터 타워 (사이버 시안)
// ════════════════════════════════════════════════════════
function buildTower(g,o){
  const{MAP,MAP_W,MAP_H,T,TS}=o;const s=TS;
  const at=(c,r)=>(c<0||r<0||c>=MAP_W||r>=MAP_H)?T.VOID:MAP[r*MAP_W+c];
  const MW=MAP_W*s,MH=MAP_H*s;
  let bg=g.createLinearGradient(0,0,0,MH);
  bg.addColorStop(0,'#050a18');bg.addColorStop(1,'#0a1426');
  g.fillStyle=bg;g.fillRect(0,0,MW,MH);
  for(let i=0;i<200;i++){
    g.fillStyle='rgba(90,220,255,'+(0.04+h2(i,91)*0.12)+')';
    g.fillRect(h2(i,92)*MW,h2(i,93)*MH,1.3,1.3);
  }
  for(let i=0;i<4;i++){ // 빛기둥
    const lx=h2(i,95)*MW;
    const lg=g.createLinearGradient(lx,0,lx+40,0);
    lg.addColorStop(0,'rgba(80,200,255,0)');lg.addColorStop(.5,'rgba(80,200,255,0.03)');lg.addColorStop(1,'rgba(80,200,255,0)');
    g.fillStyle=lg;g.fillRect(lx,0,40,MH);
  }
  function floor(x,y,c,r){
    const t2=0.92+h2(c,r)*0.14;
    g.fillStyle='rgb('+Math.round(34*t2)+','+Math.round(40*t2)+','+Math.round(58*t2)+')';
    g.fillRect(x,y,s,s);
    g.strokeStyle='rgba(120,160,220,0.07)';g.lineWidth=1;
    for(let k=14;k<s;k+=14){
      g.beginPath();g.moveTo(x+k,y+2);g.lineTo(x+k,y+s-2);g.stroke();
      g.beginPath();g.moveTo(x+2,y+k);g.lineTo(x+s-2,y+k);g.stroke();
    }
    g.fillStyle='rgba(255,255,255,0.05)';g.fillRect(x+1,y+1,s-2,2);
    g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(x+1,y+s-3,s-2,2);
    if(h2(c*7,r*3)>0.7){ // 회로 트레이스
      g.strokeStyle='rgba(53,224,255,0.14)';g.lineWidth=1.4;
      const sx=x+8+h2(c,r)*20,sy=y+8+h2(r,c)*20;
      g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+14,sy);g.lineTo(sx+14,sy+12);g.stroke();
      g.fillStyle='rgba(53,224,255,0.3)';g.beginPath();g.arc(sx+14,sy+12,1.8,0,6.283);g.fill();
    }
  }
  function road(x,y,c,r){
    g.fillStyle='#171d2e';g.fillRect(x,y,s,s);
    const hR=at(c+1,r)===T.ROAD||at(c-1,r)===T.ROAD;
    g.fillStyle='rgba(120,220,255,0.10)';
    if(hR){for(let px=6;px<s;px+=14){
      g.beginPath();g.moveTo(x+px,y+s/2-5);g.lineTo(x+px+6,y+s/2);g.lineTo(x+px,y+s/2+5);g.lineTo(x+px+2.5,y+s/2);g.closePath();g.fill();}}
    else{for(let py=6;py<s;py+=14){
      g.beginPath();g.moveTo(x+s/2-5,y+py);g.lineTo(x+s/2,y+py+6);g.lineTo(x+s/2+5,y+py);g.lineTo(x+s/2,y+py+2.5);g.closePath();g.fill();}}
    g.fillStyle='rgba(63,214,255,0.5)';
    if(at(c,r-1)!==T.ROAD&&at(c,r-1)!==T.DOOR)g.fillRect(x+3,y+2,s-6,2);
    if(at(c,r+1)!==T.ROAD&&at(c,r+1)!==T.DOOR)g.fillRect(x+3,y+s-4,s-6,2);
    if(at(c-1,r)!==T.ROAD&&at(c-1,r)!==T.DOOR)g.fillRect(x+2,y+3,2,s-6);
    if(at(c+1,r)!==T.ROAD&&at(c+1,r)!==T.DOOR)g.fillRect(x+s-4,y+3,2,s-6);
  }
  function wall(x,y,c,r){
    g.fillStyle='#2b3050';g.fillRect(x,y,s,s);
    g.fillStyle='#232848';
    for(let k=6;k<s;k+=12)g.fillRect(x+k,y+4,5,s-8);
    g.fillStyle='rgba(255,255,255,0.07)';g.fillRect(x,y,s,3);
    g.fillStyle='rgba(0,0,0,0.3)';g.fillRect(x,y+s-3,s,3);
    for(let i=0;i<4;i++){
      const v=h2(c*5+i,r*7);
      g.fillStyle=v>0.7?'#58e08a':(v>0.4?'#ffce6a':'#39406a');
      g.beginPath();g.arc(x+9+i*12,y+8,1.7,0,6.283);g.fill();
      if(v>0.7){g.fillStyle='rgba(88,224,138,0.2)';g.beginPath();g.arc(x+9+i*12,y+8,3.6,0,6.283);g.fill();}
    }
  }
  function door(x,y,c,r){
    g.fillStyle='#3c4468';g.fillRect(x,y,s,s);
    g.fillStyle='#10182c';g.fillRect(x+6,y+6,s-12,s-8);
    g.strokeStyle='rgba(63,214,255,0.7)';g.lineWidth=1.8;
    g.beginPath();g.moveTo(x+s/2,y+6);g.lineTo(x+s/2,y+s-2);g.stroke();
    g.strokeStyle='rgba(63,214,255,0.2)';g.lineWidth=5;
    g.beginPath();g.moveTo(x+s/2,y+6);g.lineTo(x+s/2,y+s-2);g.stroke();
    g.fillStyle='rgba(120,220,255,0.6)';g.fillRect(x+8,y+3,s-16,2.4);
    g.fillStyle='#22b0d8';g.fillRect(x+s-14,y+s/2-4,5,8);
  }
  function sign(x,y,c,r){
    wall(x,y,c,r);
    g.fillStyle='#0c1220';rr(g,x+7,y+12,s-14,s-26,3);g.fill();
    g.strokeStyle='rgba(70,120,180,0.6)';g.lineWidth=1.4;rr(g,x+7,y+12,s-14,s-26,3);g.stroke();
    g.fillStyle='rgba(82,232,255,0.8)';
    g.fillRect(x+11,y+18,s-24,2.6);g.fillRect(x+11,y+25,s-30,2.6);
    g.fillStyle='rgba(82,232,255,0.18)';g.fillRect(x+7,y+12,s-14,s-26);
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    switch(t){
      case T.FLOOR:floor(x,y,c,r);break;
      case T.PORTAL:floor(x,y,c,r);break;
      case T.ROAD:road(x,y,c,r);break;
      case T.WALL:wall(x,y,c,r);break;
      case T.DOOR:door(x,y,c,r);break;
      case T.SIGN:sign(x,y,c,r);break;
    }
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c];
    if(t===T.WALL||t===T.SERV||t===T.SIGN){
      const bt=at(c,r+1);
      if(bt===T.FLOOR||bt===T.ROAD||bt===T.NET||bt===T.AI||bt===T.CPU||bt===T.DEC){
        const x=c*s,y=(r+1)*s;
        const sg2=g.createLinearGradient(0,y,0,y+12);
        sg2.addColorStop(0,'rgba(0,4,14,0.45)');sg2.addColorStop(1,'rgba(0,4,14,0)');
        g.fillStyle=sg2;g.fillRect(x,y,s,12);
      }
    }
  }
  return{
    anim:[T.SERV,T.PORTAL,T.DEC,T.NET,T.AI,T.CPU],
    theme:{
      grade:['rgba(90,220,255,0.13)','rgba(10,20,60,0.24)'],
      pmode:'data',pcol:'80,220,255',scan:true,vig:0.26
    }
  };
}

// ════════════════════════════════════════════════════════
// STAGE 6 — DEC 본부 (진홍 경계경보)
// ════════════════════════════════════════════════════════
function buildHQ(g,o){
  const{MAP,MAP_W,MAP_H,T,TS}=o;const s=TS;
  const at=(c,r)=>(c<0||r<0||c>=MAP_W||r>=MAP_H)?T.VOID:MAP[r*MAP_W+c];
  const MW=MAP_W*s,MH=MAP_H*s;
  let bg=g.createLinearGradient(0,0,0,MH);
  bg.addColorStop(0,'#0b0512');bg.addColorStop(1,'#150822');
  g.fillStyle=bg;g.fillRect(0,0,MW,MH);
  const rh=g.createLinearGradient(0,MH*0.6,0,MH);
  rh.addColorStop(0,'rgba(255,30,60,0)');rh.addColorStop(1,'rgba(255,30,60,0.05)');
  g.fillStyle=rh;g.fillRect(0,0,MW,MH);
  for(let i=0;i<80;i++){
    g.fillStyle='rgba(255,80,120,'+(0.03+h2(i,61)*0.06)+')';
    g.fillRect(h2(i,62)*MW,h2(i,63)*MH,1.4,1.4);
  }
  function floor(x,y,c,r){
    const t2=0.9+h2(c,r)*0.18;
    g.fillStyle='rgb('+Math.round(27*t2)+','+Math.round(18*t2)+','+Math.round(40*t2)+')';
    g.fillRect(x,y,s,s);
    g.fillStyle='rgba(255,255,255,0.045)';g.fillRect(x+2,y+2,s-4,2);
    g.fillStyle='rgba(0,0,0,0.3)';g.fillRect(x+2,y+s-4,s-4,2);
    g.strokeStyle='rgba(255,40,110,0.10)';g.lineWidth=1;
    g.strokeRect(x+1,y+1,s-2,s-2);
    if(h2(c*3,r*7)>0.75){
      g.strokeStyle='rgba(120,110,160,0.12)';g.lineWidth=1;
      g.beginPath();g.moveTo(x+8+h2(c,r)*20,y+10);g.lineTo(x+20+h2(r,c)*20,y+s-12);g.stroke();
    }
  }
  function path(x,y,c,r){
    g.fillStyle='#100a1c';g.fillRect(x,y,s,s);
    const hP=at(c+1,r)===T.PATH||at(c-1,r)===T.PATH;
    // 사이드 레일
    g.fillStyle='#241a34';
    if(hP){g.fillRect(x,y+4,s,4);g.fillRect(x,y+s-8,s,4);}
    else{g.fillRect(x+4,y,4,s);g.fillRect(x+s-8,y,4,s);}
    // 중앙 에너지 도관
    if(hP){
      const cg=g.createLinearGradient(0,y+s/2-6,0,y+s/2+6);
      cg.addColorStop(0,'rgba(60,14,60,0.9)');cg.addColorStop(.5,'rgba(120,20,80,0.9)');cg.addColorStop(1,'rgba(60,14,60,0.9)');
      g.fillStyle=cg;g.fillRect(x,y+s/2-6,s,12);
      g.fillStyle='rgba(255,46,120,0.5)';g.fillRect(x,y+s/2-1.5,s,3);
      g.fillStyle='rgba(255,46,120,0.14)';g.fillRect(x,y+s/2-6,s,12);
      g.fillStyle='rgba(255,150,190,0.55)';
      for(let px=5;px<s;px+=13){g.beginPath();g.moveTo(x+px,y+s/2-3);g.lineTo(x+px+4,y+s/2);g.lineTo(x+px,y+s/2+3);g.closePath();g.fill();}
    }else{
      const cg=g.createLinearGradient(x+s/2-6,0,x+s/2+6,0);
      cg.addColorStop(0,'rgba(60,14,60,0.9)');cg.addColorStop(.5,'rgba(120,20,80,0.9)');cg.addColorStop(1,'rgba(60,14,60,0.9)');
      g.fillStyle=cg;g.fillRect(x+s/2-6,y,12,s);
      g.fillStyle='rgba(255,46,120,0.5)';g.fillRect(x+s/2-1.5,y,3,s);
      g.fillStyle='rgba(255,46,120,0.14)';g.fillRect(x+s/2-6,y,12,s);
      g.fillStyle='rgba(255,150,190,0.55)';
      for(let py=5;py<s;py+=13){g.beginPath();g.moveTo(x+s/2-3,y+py);g.lineTo(x+s/2,y+py+4);g.lineTo(x+s/2+3,y+py);g.closePath();g.fill();}
    }
  }
  function wall(x,y,c,r){
    g.fillStyle='#221733';g.fillRect(x,y,s,s);
    for(let i=0;i<2;i++){
      const off=((r*2+i)%2)*(s/4);
      for(let j=-1;j<3;j++){
        const bx=x+j*(s/2)+off+1,by=y+1+i*(s/2),bw=s/2-2;
        const cx2=Math.max(x,bx),cw=Math.min(x+s,bx+bw)-cx2;
        if(cw<=0)continue;
        const t2=0.85+h2(c*11+j,r*5+i)*0.3;
        g.fillStyle='rgb('+Math.round(48*t2)+','+Math.round(34*t2)+','+Math.round(72*t2)+')';
        rr(g,cx2,by,cw,s/2-2,3);g.fill();
        g.fillStyle='rgba(180,140,255,0.08)';g.fillRect(cx2+2,by+1.5,Math.max(0,cw-4),2);
        g.fillStyle='rgba(0,0,0,0.3)';g.fillRect(cx2+2,by+s/2-5,Math.max(0,cw-4),2);
      }
    }
    if(at(c,r-1)!==T.WALL&&at(c,r-1)!==T.CORE){ // 상단 경고 스트립
      for(let i=0;i<7;i++){
        g.fillStyle=i%2?'rgba(204,34,51,0.8)':'rgba(20,6,14,0.8)';
        g.fillRect(x+i*(s/7),y,s/7,4);
      }
    }
  }
  function sign(x,y,c,r){
    wall(x,y,c,r);
    g.fillStyle='#150c20';rr(g,x+7,y+12,s-14,s-24,3);g.fill();
    g.strokeStyle='rgba(255,51,85,0.6)';g.lineWidth=1.5;rr(g,x+7,y+12,s-14,s-24,3);g.stroke();
    g.fillStyle='rgba(255,51,85,0.8)';
    g.fillRect(x+11,y+18,s-24,2.6);g.fillRect(x+11,y+25,s-30,2.6);
    g.fillStyle='rgba(255,51,85,0.12)';g.fillRect(x+7,y+12,s-14,s-24);
  }
  function cage(x,y,c,r){
    g.fillStyle='#1c2130';g.fillRect(x,y,s,s);
    g.strokeStyle='rgba(0,0,0,0.25)';g.lineWidth=1.2;
    for(let k=-s;k<s*2;k+=11){
      g.beginPath();g.moveTo(x+k,y);g.lineTo(x+k+s,y+s);g.stroke();
      g.beginPath();g.moveTo(x+k+s,y);g.lineTo(x+k,y+s);g.stroke();
    }
    g.fillStyle='rgba(255,255,255,0.05)';g.fillRect(x+1,y+1,s-2,2);
    g.fillStyle='#31364a';
    g.fillRect(x+4,y+4,2,2);g.fillRect(x+s-6,y+4,2,2);
    g.fillRect(x+4,y+s-6,2,2);g.fillRect(x+s-6,y+s-6,2,2);
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    switch(t){
      case T.FLOOR:floor(x,y,c,r);break;
      case T.PORTAL:floor(x,y,c,r);break;
      case T.PATH:path(x,y,c,r);break;
      case T.WALL:wall(x,y,c,r);break;
      case T.SIGN:sign(x,y,c,r);break;
      case T.CAGE:cage(x,y,c,r);break;
    }
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c];
    if(t===T.WALL||t===T.CORE||t===T.PIPE||t===T.TERM){
      const bt=at(c,r+1);
      if(bt===T.FLOOR||bt===T.PATH||bt===T.CAGE||bt===T.ALARM){
        const x=c*s,y=(r+1)*s;
        const sg2=g.createLinearGradient(0,y,0,y+12);
        sg2.addColorStop(0,'rgba(0,0,0,0.45)');sg2.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle=sg2;g.fillRect(x,y,s,12);
      }
    }
  }
  return{
    anim:[T.CORE,T.GATE,T.PORTAL,T.PIPE,T.ALARM,T.TERM],
    overlay:{ids:[T.PATH],fn:function(ctx,sx,sy,c,r,ts){
      const t=Date.now()/1000;
      const a=0.05+0.06*(Math.sin(t*2+c*0.8+r*0.6)+1)/2;
      ctx.fillStyle='rgba(255,46,120,'+a+')';
      ctx.fillRect(sx+2,sy+2,ts-4,ts-4);
    }},
    theme:{
      grade:['rgba(255,70,130,0.12)','rgba(15,0,20,0.30)'],
      pmode:'ash',pcol:'200,185,205',alarm:'255,40,80',vig:0.34
    }
  };
}

// ════════════════════════════════════════════════════════
// PROLOGUE — 평화로운 마을 (o.dark=true → 정전 버전)
// ════════════════════════════════════════════════════════
function buildVillage(g,o){
  const{MAP,MAP_W,MAP_H,T,TS}=o;const s=TS;const dark=!!o.dark;
  const at=(c,r)=>(c<0||r<0||c>=MAP_W||r>=MAP_H)?T.TREE:MAP[r*MAP_W+c];
  const MW=MAP_W*s,MH=MAP_H*s;
  // 잔디 바탕(연속)
  let bg=g.createLinearGradient(0,0,0,MH);
  bg.addColorStop(0,'#4f9e38');bg.addColorStop(.6,'#3f8a2c');bg.addColorStop(1,'#357824');
  g.fillStyle=bg;g.fillRect(0,0,MW,MH);
  for(let i=0;i<70;i++){
    const x=h2(i,31)*MW,y=h2(i,32)*MH,rr2=40+h2(i,33)*90,lt=h2(i,34)>0.5;
    const b=g.createRadialGradient(x,y,0,x,y,rr2);
    b.addColorStop(0,lt?'rgba(220,255,160,0.09)':'rgba(20,70,20,0.10)');b.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=b;g.beginPath();g.arc(x,y,rr2,0,6.283);g.fill();
  }
  for(let i=0;i<400;i++){
    const x=h2(i,35)*MW,y=h2(i,36)*MH;
    g.strokeStyle=h2(i,37)>0.5?'rgba(30,80,26,0.5)':'rgba(150,220,120,0.4)';
    g.lineWidth=1.2;
    g.beginPath();g.moveTo(x,y+3);g.quadraticCurveTo(x+(h2(i,38)-.5)*3,y,x+(h2(i,39)-.5)*5,y-3);g.stroke();
  }
  function path(x,y,c,r){
    const P=T.PATH,L=T.PLAZA;
    const pg=g.createLinearGradient(x,y,x,y+s);
    pg.addColorStop(0,'#d4ac6e');pg.addColorStop(1,'#c19453');
    g.fillStyle=pg;rr(g,x+3,y+3,s-6,s-6,11);g.fill();
    g.fillStyle='#cba15f';
    if(at(c+1,r)===P||at(c+1,r)===L)g.fillRect(x+s-11,y+5,11,s-10);
    if(at(c-1,r)===P||at(c-1,r)===L)g.fillRect(x,y+5,11,s-10);
    if(at(c,r+1)===P||at(c,r+1)===L)g.fillRect(x+5,y+s-11,s-10,11);
    if(at(c,r-1)===P||at(c,r-1)===L)g.fillRect(x+5,y,s-10,11);
    g.fillStyle='#cfa763';
    for(let i=0;i<6;i++){
      const a=h2(c*31+i,r*17)*6.283,rd=3+h2(c,r+i)*4;
      g.beginPath();g.arc(x+s/2+Math.cos(a)*(s/2-4),y+s/2+Math.sin(a)*(s/2-4),rd,0,6.283);g.fill();
    }
    speck(g,x,y,s,3,'130,90,45',0.3,0.2,c*9,r*3);
  }
  function plaza(x,y,c,r){
    g.fillStyle='#b39a64';g.fillRect(x,y,s,s);
    for(let i=0;i<3;i++)for(let j=0;j<3;j++){
      const t2=0.88+h2(c*7+j+i,r*5+i)*0.24;
      g.fillStyle='rgb('+Math.round(206*t2)+','+Math.round(180*t2)+','+Math.round(122*t2)+')';
      rr(g,x+2+j*(s/3),y+2+i*(s/3),s/3-4,s/3-4,5);g.fill();
      g.fillStyle='rgba(255,240,200,0.2)';g.fillRect(x+4+j*(s/3),y+3+i*(s/3),s/3-8,2);
    }
  }
  function darkTile(x,y,c,r){
    g.fillStyle='#0a0c12';g.fillRect(x,y,s,s);
    if(h2(c,r)>0.85){g.fillStyle='rgba(120,150,220,0.06)';g.fillRect(x+h2(c*3,r)*(s-2),y+h2(c,r*3)*(s-2),2,2);}
  }
  function tree(x,y,c,r){
    const cx2=x+s/2+(h2(c,r)-.5)*6, ty=y+s*0.55;
    shadow(g,cx2+4,y+s-6,15,5,0.3);
    g.fillStyle='#6e4a26';rr(g,cx2-3.5,ty,7,s*0.38,3);g.fill();
    const k1=h2(c*3,r*7);
    g.fillStyle='#2e7a1e';g.beginPath();g.arc(cx2,ty-6,15+k1*2,0,6.283);g.fill();
    g.fillStyle='#3f9a2c';g.beginPath();g.arc(cx2-5,ty-9,11,0,6.283);g.fill();
    g.fillStyle='#55b03c';g.beginPath();g.arc(cx2+5,ty-11,9,0,6.283);g.fill();
    g.fillStyle='rgba(220,255,170,0.35)';g.beginPath();g.arc(cx2+7,ty-14,4,0,6.283);g.fill();
    if(h2(c*5,r*3)>0.78){
      g.fillStyle='#e84a3c';
      g.beginPath();g.arc(cx2-6,ty-4,2.2,0,6.283);g.fill();
      g.beginPath();g.arc(cx2+8,ty-8,2.2,0,6.283);g.fill();
    }
  }
  function house(x,y,c,r){
    const rf=g.createLinearGradient(0,y,0,y+22);
    rf.addColorStop(0,'#d0724f');rf.addColorStop(1,'#a85338');
    g.fillStyle=rf;g.fillRect(x,y,s,22);
    g.fillStyle='rgba(140,60,40,0.45)';
    for(let ry=5;ry<22;ry+=6)for(let rx2=(((ry/6)|0)%2)*6;rx2<s;rx2+=12){g.beginPath();g.arc(x+rx2+6,y+ry,6,0,Math.PI);g.fill();}
    g.fillStyle='rgba(255,220,180,0.35)';g.fillRect(x,y,s,2.5);
    const wl=g.createLinearGradient(0,y+22,0,y+s);
    wl.addColorStop(0,'#e8d2ac');wl.addColorStop(1,'#cfb287');
    g.fillStyle=wl;g.fillRect(x,y+22,s,s-22);
    g.strokeStyle='#7a5a34';g.lineWidth=2;g.strokeRect(x+1,y+22,s-2,s-23);
    const wx=x+s/2-8,wy=y+28;
    g.fillStyle='#6e4c28';g.fillRect(wx-2,wy-2,20,16);
    const win=g.createLinearGradient(0,wy,0,wy+12);
    win.addColorStop(0,'#ffe9b0');win.addColorStop(1,'#ffc25e');
    g.fillStyle=win;g.fillRect(wx,wy,16,12);
    g.strokeStyle='#6e4c28';g.lineWidth=1.4;
    g.beginPath();g.moveTo(wx+8,wy);g.lineTo(wx+8,wy+12);g.stroke();
  }
  function wall(x,y,c,r){
    const t2=0.92+h2(c*3,r*5)*0.14;
    g.fillStyle='rgb('+Math.round(226*t2)+','+Math.round(203*t2)+','+Math.round(160*t2)+')';
    g.fillRect(x,y,s,s);
    g.strokeStyle='#7a5a34';g.lineWidth=2.4;g.strokeRect(x+1.2,y+1.2,s-2.4,s-2.4);
    if(h2(c,r)>0.5){g.beginPath();g.moveTo(x+2,y+2);g.lineTo(x+s-2,y+s-2);g.stroke();}
    else{g.beginPath();g.moveTo(x+s/2,y+2);g.lineTo(x+s/2,y+s-2);g.stroke();}
    g.fillStyle='rgba(255,255,255,0.18)';g.fillRect(x+2,y+2,s-4,2.5);
  }
  function fence(x,y,c,r){
    const wood=g.createLinearGradient(0,y+10,0,y+36);
    wood.addColorStop(0,'#a5713c');wood.addColorStop(1,'#8a5a2c');
    g.fillStyle=wood;
    g.fillRect(x,y+16,s,4.5);g.fillRect(x,y+27,s,4.5);
    for(let i=0;i<3;i++){
      rr(g,x+4+i*(s/3+2),y+10,6,26,3);g.fill();
      g.fillStyle='rgba(255,220,170,0.35)';g.fillRect(x+5+i*(s/3+2),y+11,2,22);
      g.fillStyle=wood;
    }
  }
  function flower(x,y,c,r){
    for(let i=0;i<4;i++){
      const fx=x+9+h2(c*7+i,r*3)*(s-18), fy=y+10+h2(c*3,r*7+i)*(s-20);
      const col=['#ff8a4a','#ff6a9a','#ffe066','#c08aff'][Math.floor(h2(c+i,r+i*3+1)*4)];
      g.strokeStyle='rgba(30,90,26,0.8)';g.lineWidth=1.4;
      g.beginPath();g.moveTo(fx,fy+7);g.quadraticCurveTo(fx+1,fy+3,fx,fy+1);g.stroke();
      g.fillStyle=col;
      for(let p=0;p<5;p++){const a=p/5*6.283;g.beginPath();g.arc(fx+Math.cos(a)*2.6,fy+Math.sin(a)*2.6,2,0,6.283);g.fill();}
      g.fillStyle='#fff6d8';g.beginPath();g.arc(fx,fy,1.8,0,6.283);g.fill();
    }
  }
  function well(x,y,c,r){
    plaza(x,y,c,r);
    shadow(g,x+s/2+3,y+s-8,15,4.5,0.3);
    g.fillStyle='#8a8d96';g.beginPath();g.arc(x+s/2,y+s*0.62,13,0,6.283);g.fill();
    for(let i=0;i<8;i++){const a=i/8*6.283;g.fillStyle=i%2?'#9a9da6':'#84878e';
      g.beginPath();g.arc(x+s/2+Math.cos(a)*11,y+s*0.62+Math.sin(a)*11,3.2,0,6.283);g.fill();}
    g.fillStyle='#1c3a54';g.beginPath();g.arc(x+s/2,y+s*0.62,7,0,6.283);g.fill();
    g.fillStyle='rgba(170,220,255,0.5)';g.beginPath();g.arc(x+s/2-2,y+s*0.6,2,0,6.283);g.fill();
    g.fillStyle='#7a5226';
    g.fillRect(x+s/2-13,y+10,4,22);g.fillRect(x+s/2+9,y+10,4,22);
    g.fillStyle='#9c3f2c';
    g.beginPath();g.moveTo(x+s/2,y+2);g.lineTo(x+s/2-16,y+12);g.lineTo(x+s/2+16,y+12);g.closePath();g.fill();
    g.strokeStyle='#5a2418';g.lineWidth=1;
    g.beginPath();g.moveTo(x+s/2,y+2);g.lineTo(x+s/2-16,y+12);g.lineTo(x+s/2+16,y+12);g.closePath();g.stroke();
    g.strokeStyle='#4a3418';g.lineWidth=1.4;
    g.beginPath();g.moveTo(x+s/2,y+12);g.lineTo(x+s/2,y+s*0.5);g.stroke();
    g.fillStyle='#6e4a26';g.fillRect(x+s/2-3,y+s*0.5,6,5);
  }
  function barrel(x,y,c,r){
    plaza(x,y,c,r);
    shadow(g,x+s/2+3,y+s-9,11,3.5,0.3);
    const bg2=g.createLinearGradient(x+s/2-9,0,x+s/2+9,0);
    bg2.addColorStop(0,'#9a6a34');bg2.addColorStop(.5,'#7c5124');bg2.addColorStop(1,'#5e3a18');
    g.fillStyle=bg2;rr(g,x+s/2-9,y+s*0.3,18,24,5);g.fill();
    g.fillStyle='#3f3f46';
    g.fillRect(x+s/2-10,y+s*0.38,20,3);g.fillRect(x+s/2-10,y+s*0.62,20,3);
    g.fillStyle='#b98a4e';g.beginPath();g.ellipse(x+s/2,y+s*0.3,9,3.4,0,0,6.283);g.fill();
    g.strokeStyle='rgba(60,36,14,0.6)';g.lineWidth=1;
    g.beginPath();g.moveTo(x+s/2-3,y+s*0.34);g.lineTo(x+s/2-3,y+s*0.72);g.stroke();
    g.beginPath();g.moveTo(x+s/2+3,y+s*0.34);g.lineTo(x+s/2+3,y+s*0.72);g.stroke();
  }
  // 바닥 → 건물 → 그림자 → 소품
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    if(t===T.PATH)path(x,y,c,r);
    else if(t===T.PLAZA)plaza(x,y,c,r);
    else if(t===T.DARK)darkTile(x,y,c,r);
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    if(t===T.HOUSE)house(x,y,c,r);
    else if(t===T.WALL)wall(x,y,c,r);
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c];
    if(t===T.HOUSE||t===T.WALL){
      const bt=at(c,r+1);
      if(bt===T.GRASS||bt===T.PATH||bt===T.PLAZA||bt===T.FLOWER){
        const x=c*s,y=(r+1)*s;
        const sg2=g.createLinearGradient(0,y,0,y+11);
        sg2.addColorStop(0,'rgba(20,30,10,0.32)');sg2.addColorStop(1,'rgba(20,30,10,0)');
        g.fillStyle=sg2;g.fillRect(x,y,s,11);
      }
    }
  }
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){
    const t=MAP[r*MAP_W+c],x=c*s,y=r*s;
    if(t===T.TREE)tree(x,y,c,r);
    else if(t===T.FENCE)fence(x,y,c,r);
    else if(t===T.FLOWER)flower(x,y,c,r);
    else if(t===T.WELL)well(x,y,c,r);
    else if(t===T.BARREL)barrel(x,y,c,r);
  }
  // 정전 버전: 차갑게 가라앉히고 달빛만
  if(dark){
    g.fillStyle='rgba(6,8,24,0.62)';g.fillRect(0,0,MW,MH);
    const ml=g.createRadialGradient(MW/2,-40,20,MW/2,-40,MH*0.9);
    ml.addColorStop(0,'rgba(150,180,255,0.12)');ml.addColorStop(1,'rgba(150,180,255,0)');
    g.fillStyle=ml;g.fillRect(0,0,MW,MH);
    for(let i=0;i<40;i++){
      g.fillStyle='rgba(200,215,255,'+(0.03+h2(i,41)*0.05)+')';
      g.fillRect(h2(i,42)*MW,h2(i,43)*MH,1.4,1.4);
    }
  }
  return{
    anim:[],
    theme:dark?{
      grade:['rgba(90,120,255,0.08)','rgba(0,0,12,0.30)'],
      alarm:'255,50,60',pmode:'ash',pcol:'160,170,205',vig:0.40
    }:{
      grade:['rgba(255,215,140,0.16)','rgba(30,60,20,0.14)'],
      bloom:{x:0.2,y:-0.1,r:0.55,col:'255,228,150',a:0.20},
      pmode:'motes',pcol:'255,240,205',vig:0.18
    }
  };
}

// ════════════════════════════════════════════════════════
// 대기 연출(라이팅·파티클) 팩토리
// ════════════════════════════════════════════════════════
function makeAtmo(o,th){
  const W=o.W,H=o.H;
  const parts=[];
  const mode=th.pmode||'motes';
  const n=mode==='data'?30:(mode==='embers'?30:24);
  for(let i=0;i<n;i++){
    parts.push({
      x:Math.random()*W,y:Math.random()*H,
      l:8+Math.random()*10,
      s:0.3+Math.random()*(mode==='data'?2.4:(mode==='wind'?2.2:0.6)),
      a:0.06+Math.random()*0.14,
      ph:Math.random()*6.283,
      k:Math.random()
    });
  }
  return function(ctx){
    const t=Date.now()/1000;
    // 블룸/글로우
    if(th.bloom){
      ctx.save();ctx.globalCompositeOperation='screen';
      if(th.rays){
        for(let i=0;i<2;i++){
          const bx=W*0.18+Math.sin(t*0.11+i*2.4)*W*0.09+i*W*0.34;
          const grd=ctx.createLinearGradient(bx,0,bx+W*0.16,H);
          grd.addColorStop(0,'rgba('+th.rays.col+','+(th.rays.a*2)+')');
          grd.addColorStop(.5,'rgba('+th.rays.col+','+th.rays.a*0.9+')');
          grd.addColorStop(1,'rgba('+th.rays.col+',0)');
          ctx.fillStyle=grd;
          ctx.beginPath();ctx.moveTo(bx,-10);ctx.lineTo(bx+W*0.10,-10);
          ctx.lineTo(bx+W*0.30,H+10);ctx.lineTo(bx+W*0.13,H+10);ctx.closePath();ctx.fill();
        }
      }
      const sb=ctx.createRadialGradient(W*th.bloom.x,H*th.bloom.y,10,W*th.bloom.x,H*th.bloom.y,W*th.bloom.r);
      sb.addColorStop(0,'rgba('+th.bloom.col+','+th.bloom.a+')');
      sb.addColorStop(1,'rgba('+th.bloom.col+',0)');
      ctx.fillStyle=sb;ctx.fillRect(0,0,W,H);
      ctx.restore();
    }
    if(th.bottomGlow){
      ctx.save();ctx.globalCompositeOperation='screen';
      const a=th.bottomGlow.a*(0.85+0.15*Math.sin(t*1.7));
      const bg2=ctx.createRadialGradient(W/2,H*1.15,20,W/2,H*1.15,H*0.9);
      bg2.addColorStop(0,'rgba('+th.bottomGlow.col+','+a+')');
      bg2.addColorStop(1,'rgba('+th.bottomGlow.col+',0)');
      ctx.fillStyle=bg2;ctx.fillRect(0,0,W,H);
      ctx.restore();
    }
    // 색보정
    if(th.grade){
      ctx.save();ctx.globalCompositeOperation='overlay';
      const gr=ctx.createLinearGradient(0,0,W,H);
      gr.addColorStop(0,th.grade[0]);gr.addColorStop(.55,'rgba(0,0,0,0)');gr.addColorStop(1,th.grade[1]);
      ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
      ctx.restore();
    }
    // 헤이즈(연기)
    if(th.haze){
      for(let i=0;i<2;i++){
        const hx=((t*12+i*300)%(W+320))-160;
        const hy=H*0.25+Math.sin(t*0.4+i*2)*H*0.1+i*H*0.3;
        const hg=ctx.createRadialGradient(hx,hy,10,hx,hy,130);
        hg.addColorStop(0,'rgba(160,150,140,0.05)');hg.addColorStop(1,'rgba(160,150,140,0)');
        ctx.fillStyle=hg;
        ctx.save();ctx.translate(hx,hy);ctx.scale(1.8,1);ctx.translate(-hx,-hy);
        ctx.beginPath();ctx.arc(hx,hy,130,0,6.283);ctx.fill();ctx.restore();
      }
    }
    // 스캔라인(사이버)
    if(th.scan){
      const sy=((t*26)%(H+160))-80;
      const sc2=ctx.createLinearGradient(0,sy-40,0,sy+40);
      sc2.addColorStop(0,'rgba(120,230,255,0)');sc2.addColorStop(.5,'rgba(120,230,255,0.05)');sc2.addColorStop(1,'rgba(120,230,255,0)');
      ctx.save();ctx.globalCompositeOperation='screen';
      ctx.fillStyle=sc2;ctx.fillRect(0,sy-40,W,80);ctx.restore();
    }
    // 경보 펄스(본부)
    if(th.alarm){
      const a=0.03+0.05*(Math.sin(t*2.4)+1)/2;
      const ag=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.9);
      ag.addColorStop(0,'rgba('+th.alarm+',0)');ag.addColorStop(1,'rgba('+th.alarm+','+a+')');
      ctx.fillStyle=ag;ctx.fillRect(0,0,W,H);
    }
    // 비네트
    const vg=ctx.createRadialGradient(W/2,H*0.46,H*0.35,W/2,H*0.5,H*0.85);
    vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(8,4,10,'+(th.vig||0.22)+')');
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    // 파티클
    for(const p of parts){
      if(mode==='wind'){
        p.x+=p.s+1.2;p.y+=Math.sin(t*2+p.ph)*0.3;
        if(p.x>W+20){p.x=-20;p.y=Math.random()*H;}
        ctx.strokeStyle='rgba('+th.pcol+','+p.a+')';ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.l,p.y+2);ctx.stroke();
      }else if(mode==='embers'){
        p.y-=p.s+0.25;p.x+=Math.sin(t*1.6+p.ph)*0.4;
        if(p.y<-8){p.y=H+8;p.x=Math.random()*W;}
        const fl=0.5+0.5*Math.sin(t*6+p.ph);
        ctx.fillStyle='rgba('+(p.k>0.5?th.pcol:'255,90,40')+','+(p.a*(0.5+fl*0.8))+')';
        ctx.fillRect(p.x,p.y,1.8+p.k,1.8+p.k);
      }else if(mode==='data'){
        p.y-=p.s+0.8;
        if(p.y<-14){p.y=H+10;p.x=Math.floor(Math.random()*(W/16))*16;}
        for(let k=0;k<3;k++){
          ctx.fillStyle='rgba('+th.pcol+','+(p.a*(1-k*0.33))+')';
          ctx.fillRect(p.x,p.y+k*5,2.2,2.2);
        }
      }else if(mode==='ash'){
        p.y+=p.s*0.5+0.12;p.x+=Math.sin(t*0.9+p.ph)*0.35;
        if(p.y>H+8){p.y=-8;p.x=Math.random()*W;}
        ctx.fillStyle='rgba('+th.pcol+','+(p.a*0.8)+')';
        ctx.fillRect(p.x,p.y,1.7,1.7);
      }else{ // motes
        p.y-=p.s*0.4+0.1;p.x+=Math.sin(t*0.7+p.ph)*0.25;
        if(p.y<-6){p.y=H+6;p.x=Math.random()*W;}
        const tw=0.5+0.5*Math.sin(t*1.4+p.ph);
        ctx.fillStyle='rgba('+th.pcol+','+(p.a*(0.4+tw*0.7))+')';
        ctx.beginPath();ctx.arc(p.x,p.y,1+p.k*1.3,0,6.283);ctx.fill();
      }
    }
  };
}

// ── 퍼블릭 API ───────────────────────────────────────────
const BUILD={2:buildCoast,3:buildCity,4:buildFactory,5:buildTower,6:buildHQ,village:buildVillage};
function init(o){
  const cnv=document.createElement('canvas');
  cnv.width=o.MAP_W*o.TS*o.RS; cnv.height=o.MAP_H*o.TS*o.RS;
  const g=cnv.getContext('2d');
  g.scale(o.RS,o.RS); g.imageSmoothingEnabled=true;
  const spec=BUILD[o.stage](g,o);
  const animSet=new Set(spec.anim||[]);
  const ovSet=new Set((spec.overlay&&spec.overlay.ids)||[]);
  const animTiles=[],ovTiles=[];
  for(let r=0;r<o.MAP_H;r++)for(let c=0;c<o.MAP_W;c++){
    const t=o.MAP[r*o.MAP_W+c];
    if(animSet.has(t))animTiles.push({t:t,c:c,r:r});
    if(ovSet.has(t))ovTiles.push({t:t,c:c,r:r});
  }
  const atmo=makeAtmo(o,spec.theme||{});
  return{
    ground:cnv,
    animTiles:animTiles,
    drawOverlays:function(ctx,cx,cy){
      if(!spec.overlay)return;
      for(const a of ovTiles){
        const sx=a.c*o.TS-cx, sy=a.r*o.TS-cy;
        if(sx<-o.TS||sx>o.W||sy<-o.TS||sy>o.H)continue;
        spec.overlay.fn(ctx,sx,sy,a.c,a.r,o.TS);
      }
    },
    drawAtmosphere:function(ctx){atmo(ctx);}
  };
}
return{init:init};
})();

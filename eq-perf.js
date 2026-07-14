// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 저사양 기기 자동 감지 모듈 (eq-perf.js)
// 게임 플레이 중 실제 FPS를 재서, 느린 기기면 '라이트 모드'로 전환한다.
//  - EQPerf.rs()      : 권장 렌더 배율 (라이트=1, 일반=화면 배율에 맞춰 1.5~2)
//  - EQPerf.low       : 라이트 모드 여부 (분위기 효과 스킵 등에 사용)
//  - EQPerf.tick(now) : 게임 루프에서 매 프레임 호출 (FPS 측정용)
//  - EQPerf.onLow(fn) : 플레이 도중 라이트 모드로 전환되는 순간의 콜백
// 판정 결과는 localStorage('eq_perf')에 저장되어 다음 화면부터 바로 적용.
// 잘못 판정된 것 같으면 주소 뒤에 ?perf=reset 을 붙여 접속하면 초기화된다.
// ════════════════════════════════════════════════════════════
window.EQPerf=(function(){
  var KEY='eq_perf';
  var saved=null;
  try{
    if(location.search.indexOf('perf=reset')>=0)localStorage.removeItem(KEY);
    saved=localStorage.getItem(KEY);
  }catch(e){}
  var low=(saved==='low');
  var decided=(saved==='low'||saved==='ok');
  var cbs=[];

  function rs(){
    if(low)return 1;
    var d=window.devicePixelRatio||1;
    return Math.min(Math.max(d,1.5),2);
  }

  // FPS 측정: 시작 후 1초는 버리고(로딩 버벅임 배제), 이후 3초 평균이
  // 40fps 미만이면 라이트 모드로 판정한다. 한 번 판정되면 다시 재지 않는다.
  var t0=0,last=0,frames=0;
  function tick(now){
    if(decided||!now)return;
    if(last&&now-last>500){t0=0;frames=0;} // 탭 전환·일시정지 등 긴 공백 → 측정 리셋
    last=now;
    if(!t0){t0=now;return;}
    var el=now-t0;
    if(el<1000)return;
    frames++;
    if(el>=4000){
      decided=true;
      var fps=frames/((el-1000)/1000);
      var v=(fps<40)?'low':'ok';
      try{localStorage.setItem(KEY,v);}catch(e){}
      if(v==='low'){
        low=true;
        for(var i=0;i<cbs.length;i++){try{cbs[i]();}catch(e){}}
      }
    }
  }

  return{
    get low(){return low;},
    rs:rs,
    tick:tick,
    onLow:function(f){cbs.push(f);}
  };
})();

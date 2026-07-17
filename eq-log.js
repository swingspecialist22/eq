// ════════════════════════════════════════════════════════════
// 에너지 퀘스트 — 학습 결과 기록·내보내기 모듈 (eq-log.js)
// 퀴즈·퍼즐·보스전 결과를 localStorage('eq_quiz_log')에 쌓고,
// [결과 저장] 버튼에서 CSV(엑셀 호환, UTF-8 BOM)로 내려받는다.
//  - EQLog.quiz(stage, topic, ok, sec) : 관문 퀴즈 1문항 결과
//  - EQLog.puzzle(stage, label, ok)    : 시퀀스 퍼즐 결과 (stage6)
//  - EQLog.boss(round, correct, total, dmg) : 보스전 라운드 결과
//  - EQLog.stageClear(stage)           : 스테이지 클리어
//  - EQLog.ending(grade)               : 엔딩 도달(등급)
//  - EQLog.download()                  : CSV 파일 다운로드
//  - EQLog.count()                     : 기록 건수
// 서버·계정 불필요: 학생이 파일을 받아 교사에게 제출하는 방식.
// ════════════════════════════════════════════════════════════
window.EQLog=(function(){
  var KEY='eq_quiz_log';
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch(e){return[];}}
  function write(a){try{localStorage.setItem(KEY,JSON.stringify(a));}catch(e){}}
  function pad(n){return (n<10?'0':'')+n;}
  function now(){
    var d=new Date();
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  }
  function add(kind,stage,detail,result,sec){
    var a=read();
    a.push({t:now(),k:kind,s:String(stage),d:detail||'',r:result||'',sec:(sec==null?'':sec)});
    write(a);
  }
  function esc(v){
    v=String(v==null?'':v);
    if(/[",\n]/.test(v))v='"'+v.replace(/"/g,'""')+'"';
    return v;
  }
  function playerName(){
    try{return localStorage.getItem('eq_char_name')||'이름없음';}catch(e){return '이름없음';}
  }
  function csv(){
    var rows=read();
    var head=['이름','시각','구분','스테이지','내용','결과','소요(초)'];
    var name=playerName();
    var lines=[head.join(',')];
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      lines.push([esc(name),esc(r.t),esc(r.k),esc(r.s),esc(r.d),esc(r.r),esc(r.sec)].join(','));
    }
    return '\uFEFF'+lines.join('\r\n')+'\r\n';
  }
  function download(){
    var rows=read();
    if(!rows.length){alert('아직 저장할 기록이 없어요. 퀴즈를 풀면 기록이 쌓입니다!');return false;}
    var d=new Date();
    var fname='에너지퀘스트_결과_'+playerName()+'_'+pad(d.getMonth()+1)+pad(d.getDate())+'.csv';
    var blob=new Blob([csv()],{type:'text/csv;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download=fname;
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},300);
    return true;
  }
  // ── 오답 노트: 틀린 문항을 저장, 나중에 같은 문항을 맞히면 자동 삭제 ──
  var WKEY='eq_wrong_notes';
  function updateWrongNote(stage,ok,q,picked){
    if(!q)return;
    try{
      var notes=JSON.parse(localStorage.getItem(WKEY)||'[]');
      notes=notes.filter(function(n){return n.q!==q.question;});
      if(!ok){
        notes.push({
          t:now(), s:String(stage), q:q.question,
          my:(picked>=0&&q.choices[picked]!=null)?q.choices[picked]:'(시간 초과)',
          ans:q.choices[q.answer], ex:q.explanation||''
        });
      }
      localStorage.setItem(WKEY,JSON.stringify(notes));
    }catch(e){}
  }
  return{
    quiz:function(stage,topic,ok,sec,q,picked){
      add('퀴즈',stage,topic,ok?'정답':'오답',sec);
      updateWrongNote(stage,ok,q,picked);
    },
    puzzle:function(stage,label,ok){add('퍼즐',stage,label,ok?'성공':'실패');},
    // 같은 스테이지 클리어는 1회만 기록(저장 함수가 반복 호출돼도 안전)
    stageClearOnce:function(stage){
      var a=read();
      for(var i=0;i<a.length;i++)if(a[i].k==='클리어'&&a[i].s===String(stage))return;
      add('클리어',stage,'스테이지 클리어','✓');
    },
    boss:function(round,correct,total,dmg){add('보스전','보스',round+'라운드 카드 '+correct+'/'+total+' 적중','피해 '+dmg);},
    // 엔딩 도달도 1회만 기록(clear.html 새로고침 대비)
    ending:function(grade){
      var a=read();
      for(var i=0;i<a.length;i++)if(a[i].k==='엔딩')return;
      add('엔딩','전체','최종 등급',grade);
    },
    download:download,
    csv:csv,
    count:function(){return read().length;}
  };
})();

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorPredictionReminder=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const WINDOW_MS=24*60*60*1000;
  function shouldWarn({now,deadline,complete}){
    if(complete||!deadline)return false;
    const n=new Date(now).getTime(),d=new Date(deadline).getTime(),diff=d-n;
    return Number.isFinite(diff)&&diff>0&&diff<=WINDOW_MS;
  }
  function message(label){return `${label} tahminlerinizi henüz tamamlamadınız. İlk maça 24 saatten az kaldı. Şimdi tahmin yapmak ister misiniz?`}
  function pickNext(rows){return [...(rows||[])].filter(Boolean).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline))[0]||null}
  return Object.freeze({WINDOW_MS,shouldWarn,message,pickNext});
});

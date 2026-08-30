(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorLiveScore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const LIVE=new Set(['1H','HT','2H','ET','BT','P']);
  const TERMINAL=new Set(['FT','AET','PEN']);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);

  function isLiveStatus(status){return LIVE.has(String(status||'').toUpperCase())}
  function isTerminalStatus(status){return TERMINAL.has(String(status||'').toUpperCase())}
  function isStale(fetchedAt,now=new Date(),maxAgeMs=600000){
    const fetched=new Date(fetchedAt).getTime(),current=new Date(now).getTime();
    return !Number.isFinite(fetched)||!Number.isFinite(current)||current-fetched>maxAgeMs;
  }
  function detectGoal(previous,current){
    if(!previous||!current)return false;
    const before=Number(previous.home_score)+Number(previous.away_score);
    const after=Number(current.home_score)+Number(current.away_score);
    return Number.isFinite(before)&&Number.isFinite(after)&&after>before;
  }
  function formatExactPredictors(names){
    const clean=Array.isArray(names)?names.filter(Boolean).map(String):[];
    return clean.length?`🎯 Şu an tam bilenler: ${clean.join(' • ')}`:'Şu an tam skoru bilen yok.';
  }
  function renderLiveMatchMarkup(fixture,liveState,now=new Date()){
    if(!liveState)return '';
    const status=String(liveState.status||'').toUpperCase();
    const stale=isStale(liveState.fetched_at,now);
    const label=isTerminalStatus(status)?'MS':isLiveStatus(status)?`🔴 CANLI${liveState.elapsed!=null?` • ${esc(liveState.elapsed)}’`:''}`:esc(status);
    const predictors=formatExactPredictors(liveState.exact_players);
    return `<div class="live-match${stale?' live-stale':''}" data-live-key="${esc(fixture.competition||'super_lig')}:${esc(fixture.id)}"><div class="live-status">${label}</div><div class="live-score-row"><b>${esc(fixture.home_team)}</b><strong>${esc(liveState.home_score)} - ${esc(liveState.away_score)}</strong><b>${esc(fixture.away_team)}</b></div><div class="live-exact-ticker"><span>${esc(predictors)}</span></div>${stale?'<div class="small">Canlı veri geçici olarak güncellenemiyor.</div>':''}</div>`;
  }
  return{isLiveStatus,isTerminalStatus,isStale,detectGoal,formatExactPredictors,renderLiveMatchMarkup};
});

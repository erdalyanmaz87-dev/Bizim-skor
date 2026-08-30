(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorDailyMatches=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const zone='Europe/Istanbul';
  const dayKey=date=>new Intl.DateTimeFormat('en-CA',{
    timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'
  }).format(date);
  const timeText=date=>new Intl.DateTimeFormat('tr-TR',{
    timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false
  }).format(date).replace(':','.');

  function selectDailyMatches(fixtures,now=new Date()){
    const today=dayKey(now),tomorrow=dayKey(new Date(now.getTime()+86400000));
    const future=(fixtures||[]).map(f=>({...f,date:new Date(f.kickoff)}))
      .filter(f=>!Number.isNaN(f.date.getTime())&&dayKey(f.date)>=today)
      .sort((a,b)=>a.date-b.date);
    const selectedDay=future[0]?dayKey(future[0].date):today;
    const label=selectedDay===today?'Bugünün Maçları':selectedDay===tomorrow?'Yarının Maçları':new Intl.DateTimeFormat('tr-TR',{
      timeZone:zone,day:'numeric',month:'long'
    }).format(future[0].date)+' Maçları';
    return{
      label,
      matches:future.filter(f=>dayKey(f.date)===selectedDay).map(f=>({...f,time:timeText(f.date)}))
    };
  }

  function renderDailyMatchesMarkup(day,escapeHtml){
    const safe=escapeHtml||String;
    const heading=`<h2>⚽ ${safe(day.label)}</h2>`;
    if(!day.matches.length)return heading+'<p class="small">Bugün oynanacak maç bulunmuyor.</p>';
    return heading+day.matches.map(match=>match.live&&typeof globalThis.BizimSkorLiveScore!=='undefined'
      ?globalThis.BizimSkorLiveScore.renderLiveMatchMarkup(match,match.live)
      :`<div class="daily-match"><b>${safe(match.time)}</b><span>${safe(match.home_team)} – ${safe(match.away_team)}</span></div>`).join('');
  }

  function mergeDailyMatchesWithLiveState(fixtures,rows){
    const live=new Map((rows||[]).map(row=>[`${row.competition}:${row.fixture_id}`,row]));
    return(fixtures||[]).map(fixture=>({...fixture,live:live.get(`${fixture.competition}:${fixture.id}`)||null}));
  }

  return{selectDailyMatches,renderDailyMatchesMarkup,mergeDailyMatchesWithLiveState};
});

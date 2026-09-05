(function(root,factory){
  const scoring=typeof module==='object'&&module.exports?require('./opportunity-scoring-utils.js'):root.BizimSkorOpportunityScoring;
  const api=factory(scoring);
  if(typeof module==='object'&&module.exports)module.exports=api; else{root.BizimSkorOpportunityRanking=api;setTimeout(api.mount,0)}
})(typeof globalThis!=='undefined'?globalThis:this,function(scoring){
  function outcome(h,a){return +h>+a?'1':+h<+a?'2':'X'}
  function calculateRows(ps,rs,fxs){
    const real=Object.fromEntries((rs||[]).filter(r=>r.home_score!=null&&r.away_score!=null).map(r=>[+r.fixture_id,r]));
    const fixtureMap=Object.fromEntries((fxs||[]).map(f=>[+f.id,f]));
    const grouped={};
    (ps||[]).forEach(p=>{
      const name=p.player_name;grouped[name]??={pts:0,ex:0,cr:0};
      const r=real[+p.fixture_id];if(!r)return;
      const f=fixtureMap[+p.fixture_id]||{id:+p.fixture_id,week:+p.week};
      grouped[name].pts+=scoring.score(f,p,r).points;
      const exact=+p.home_score===+r.home_score&&+p.away_score===+r.away_score;
      const correct=outcome(p.home_score,p.away_score)===outcome(r.home_score,r.away_score);
      if(exact)grouped[name].ex++;if(correct)grouped[name].cr++;
    });
    return Object.entries(grouped).map(([name,x])=>({name,...x})).sort((a,b)=>b.pts-a.pts||a.name.localeCompare(b.name,'tr'));
  }
  async function refreshAfterResult({document:doc,loadLive,loadGeneral,refreshPersonalRanks,refreshHomeDashboard}){
    await loadLive?.();
    const general=doc?.getElementById?.('general');
    if(general&&!general.classList?.contains?.('hide'))await loadGeneral?.();
    await refreshPersonalRanks?.();
    await refreshHomeDashboard?.();
  }
  function mount(){
    if(typeof window==='undefined'||!scoring)return;
    window.scoreRows=function(ps,rs){return calculateRows(ps,rs,typeof allFixtures!=='undefined'?allFixtures:fixtures)};
    window.loadGeneral=async function(){
      if(!window.BizimSkorGeneralWeeklyTotal?.load)throw new Error('Genel sıralama motoru yüklenemedi');
      return window.BizimSkorGeneralWeeklyTotal.load({client:sb,loadPlayers:loadActivePlayers,isActive:isPlayerActive,doc:document,escape:esc});
    };
  }
  return{calculateRows,refreshAfterResult,mount};
});

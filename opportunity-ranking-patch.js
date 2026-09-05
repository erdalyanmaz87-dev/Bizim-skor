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
    return Object.entries(grouped).map(([name,x])=>({name,...x})).sort((a,b)=>b.pts-a.pts||b.ex-a.ex||b.cr-a.cr||a.name.localeCompare(b.name,'tr'));
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
      let psq=await sb.from('predictions').select('*');if(psq.error)throw psq.error;let ps=psq.data||[];
      try{await loadActivePlayers();ps=ps.filter(p=>isPlayerActive(p.player_name))}catch(e){console.warn('active player filter skipped',e)}
      const rsq=await sb.from('results').select('*');if(rsq.error)throw rsq.error;
      const fq=await sb.from('fixtures').select('id,week');if(fq.error)throw fq.error;
      const rows=calculateRows(ps,rsq.data||[],fq.data||[]);
      document.getElementById('generalBoard').innerHTML=`<table><tr><th>Sıra</th><th>Katılımcı</th><th>Puan</th><th>🎯</th></tr>${rows.map((r,i)=>`<tr><td>${i===0?'🥇 1':i===1?'🥈 2':i===2?'🥉 3':i+1}</td><td>${esc(r.name)}</td><td><b>${r.pts}</b></td><td>${r.ex}</td></tr>`).join('')}</table>`;
    };
  }
  return{calculateRows,refreshAfterResult,mount};
});

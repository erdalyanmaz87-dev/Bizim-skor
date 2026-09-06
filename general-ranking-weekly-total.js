(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorGeneralWeeklyTotal=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const outcome=(home,away)=>+home>+away?'1':+home<+away?'2':'X';
  const normalizePlayer=value=>String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR');
  const isOpportunity=prediction=>(+prediction.week===4&&+prediction.fixture_id===30)||(+prediction.week===5&&+prediction.fixture_id===44);
  function pointsFor(prediction,result){const exact=+prediction.home_score===+result.home_score&&+prediction.away_score===+result.away_score,correct=outcome(prediction.home_score,prediction.away_score)===outcome(result.home_score,result.away_score),multiplier=isOpportunity(prediction)?2:1;return{points:(exact?4:correct?1:0)*multiplier,exact,correct}}
  function calculateRows(predictions,results){const real=Object.fromEntries((results||[]).filter(r=>r.home_score!=null&&r.away_score!=null).map(r=>[+r.fixture_id,r])),general={};(predictions||[]).forEach(p=>{const r=real[+p.fixture_id];if(!r)return;general[p.player_name]??={name:p.player_name,pts:0,ex:0,cr:0};const s=pointsFor(p,r),g=general[p.player_name];g.pts+=s.points;g.ex+=s.exact?1:0;g.cr+=s.correct?1:0});const rows=Object.values(general).sort((a,b)=>b.pts-a.pts||a.name.localeCompare(b.name,'tr'));let lp=null,rank=0;rows.forEach(r=>{if(r.pts!==lp){rank++;lp=r.pts}r.rank=rank});return rows}
  async function loadPersonalRank({client,playerName}){
    const query=await client.rpc('get_super_league_general_ranking');
    if(query.error)throw query.error;
    const wanted=normalizePlayer(playerName),mine=(query.data||[]).find(row=>normalizePlayer(row.player_name)===wanted);
    return mine&&+mine.league_rank?`${+mine.league_rank}.`:'—';
  }
  async function load({client,doc,escape}){
    const query=await client.rpc('get_super_league_general_ranking');
    if(query.error)throw query.error;
    const rows=(query.data||[]).map(row=>({name:row.player_name,pts:+row.total_points,ex:+row.exact_scores,cr:+row.correct_results,rank:+row.league_rank}));
    const clean=escape||String;
    doc.getElementById('generalBoard').innerHTML=`<table><tr><th>Sıra</th><th>Katılımcı</th><th>Puan</th><th>🎯</th></tr>${rows.map(row=>`<tr><td>${row.rank===1?'🥇 1':row.rank===2?'🥈 2':row.rank===3?'🥉 3':row.rank}</td><td>${clean(row.name)}</td><td><b>${row.pts}</b></td><td>${row.ex}</td></tr>`).join('')}</table>`;
    return rows;
  }
  return{pointsFor,calculateRows,loadPersonalRank,load};
});

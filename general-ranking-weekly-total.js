(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorGeneralWeeklyTotal=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const outcome=(home,away)=>+home>+away?'1':+home<+away?'2':'X';
  const isOpportunity=prediction=>(+prediction.week===4&&+prediction.fixture_id===30)||(+prediction.week===5&&+prediction.fixture_id===44);

  function pointsFor(prediction,result){
    const exact=+prediction.home_score===+result.home_score&&+prediction.away_score===+result.away_score;
    const correct=outcome(prediction.home_score,prediction.away_score)===outcome(result.home_score,result.away_score);
    const multiplier=isOpportunity(prediction)?2:1;
    return{points:(exact?4:correct?1:0)*multiplier,exact,correct};
  }

  function calculateRows(predictions,results){
    const real=Object.fromEntries((results||[]).filter(row=>row.home_score!=null&&row.away_score!=null).map(row=>[+row.fixture_id,row]));
    const weekly={};
    (predictions||[]).forEach(prediction=>{
      const result=real[+prediction.fixture_id];
      if(!result)return;
      const key=`${prediction.player_name}\u0000${+prediction.week}`;
      weekly[key]??={name:prediction.player_name,week:+prediction.week,pts:0,ex:0,cr:0};
      const scored=pointsFor(prediction,result);
      weekly[key].pts+=scored.points;
      weekly[key].ex+=scored.exact?1:0;
      weekly[key].cr+=scored.correct?1:0;
    });
    const general={};
    Object.values(weekly).forEach(row=>{
      general[row.name]??={name:row.name,pts:0,ex:0,cr:0};
      general[row.name].pts+=row.pts;
      general[row.name].ex+=row.ex;
      general[row.name].cr+=row.cr;
    });
    return Object.values(general).sort((a,b)=>b.pts-a.pts||b.ex-a.ex||b.cr-a.cr||a.name.localeCompare(b.name,'tr'));
  }

  async function load({client,loadPlayers,isActive,doc,escape}){
    let predictionQuery=await client.from('predictions').select('*');
    if(predictionQuery.error)throw predictionQuery.error;
    let predictions=predictionQuery.data||[];
    try{
      await loadPlayers?.();
      if(isActive)predictions=predictions.filter(row=>isActive(row.player_name));
    }catch(error){console.warn('active player filter skipped',error)}
    const resultQuery=await client.from('results').select('*');
    if(resultQuery.error)throw resultQuery.error;
    const rows=calculateRows(predictions,resultQuery.data||[]);
    const clean=escape||String;
    doc.getElementById('generalBoard').innerHTML=`<table><tr><th>Sıra</th><th>Katılımcı</th><th>Puan</th><th>🎯</th></tr>${rows.map((row,index)=>`<tr><td>${index===0?'🥇 1':index===1?'🥈 2':index===2?'🥉 3':index+1}</td><td>${clean(row.name)}</td><td><b>${row.pts}</b></td><td>${row.ex}</td></tr>`).join('')}</table>`;
    return rows;
  }

  return{pointsFor,calculateRows,load};
});

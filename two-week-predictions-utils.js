(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorTwoWeek=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const outcome=(home,away)=>+home>+away?'home':+home<+away?'away':'draw';
  const complete=result=>result&&result.home_score!=null&&result.away_score!=null;

  function selectVisibleWeeks(fixtures,limit=2,nowMs=Date.now()){
    return [...new Set((fixtures||[]).map(fixture=>+fixture.week))]
      .sort((a,b)=>a-b)
      .filter(week=>!isWeekLocked(fixtures,week,nowMs))
      .slice(0,limit);
  }

  function firstKickoff(fixtures,week){
    const values=(fixtures||[])
      .filter(fixture=>+fixture.week===+week)
      .map(fixture=>Date.parse(fixture.kickoff))
      .filter(Number.isFinite);
    return values.length?Math.min(...values):null;
  }

  function isWeekLocked(fixtures,week,nowMs=Date.now()){
    const first=firstKickoff(fixtures,week);
    return first!==null&&nowMs>=first;
  }

  function defaultPredictionWeek(fixtures,weeks,nowMs=Date.now()){
    return (weeks||[]).find(week=>!isWeekLocked(fixtures,week,nowMs))??weeks?.at(-1)??null;
  }

  function predictionOpportunityBadge(fixture){
    return +fixture?.week===5&&+fixture?.id===44?'🔥 FIRSAT MAÇI • X2 PUAN':'';
  }

  function summarizeFixturePrediction(result,predictions,activeNames){
    if(!complete(result))return{exactNames:[],correctResultCount:0};
    const rows=(predictions||[]).filter(prediction=>
      activeNames.has(String(prediction.player_name).toLocaleLowerCase('tr-TR'))
    );
    return{
      exactNames:rows
        .filter(prediction=>+prediction.home_score===+result.home_score&&+prediction.away_score===+result.away_score)
        .map(prediction=>prediction.player_name)
        .sort((a,b)=>a.localeCompare(b,'tr')),
      correctResultCount:rows.filter(prediction=>
        outcome(prediction.home_score,prediction.away_score)===outcome(result.home_score,result.away_score)
      ).length
    };
  }

  return{selectVisibleWeeks,isWeekLocked,defaultPredictionWeek,predictionOpportunityBadge,summarizeFixturePrediction};
});

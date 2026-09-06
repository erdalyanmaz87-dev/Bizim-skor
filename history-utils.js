(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BizimSkorHistory=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function outcome(home,away){return +home>+away?'1':+home<+away?'2':'X'}
  function scorePrediction(prediction,result){
    if(!prediction||!result||result.home_score==null||result.away_score==null)return{points:0,symbol:'',exact:0,correct:0};
    const exact=+prediction.home_score===+result.home_score&&+prediction.away_score===+result.away_score;
    const correct=outcome(prediction.home_score,prediction.away_score)===outcome(result.home_score,result.away_score);
    return{points:exact?4:correct?1:0,symbol:exact?'🎯':correct?'⚽':'',exact:exact?1:0,correct:correct?1:0};
  }
  function buildWeeklyRanking(rows){
    const created=value=>{const time=new Date(value||0).getTime();return Number.isFinite(time)&&value?time:Number.MAX_SAFE_INTEGER};
    const sorted=rows.slice().sort((a,b)=>b.points-a.points||b.exact-a.exact||b.correct-a.correct||created(a.createdAt)-created(b.createdAt)||a.name.localeCompare(b.name,'tr'));
    const podiumPoints=[];let afterPodium=0;
    return sorted.map(row=>{
      let podiumIndex=podiumPoints.indexOf(row.points);
      if(podiumIndex<0&&podiumPoints.length<3){podiumPoints.push(row.points);podiumIndex=podiumPoints.length-1}
      return{...row,rank:podiumIndex>=0?podiumIndex+1:4+afterPodium++};
    });
  }
  function visiblePredictionScore(prediction,result,isCurrentPlayer){
    if(!prediction)return'';
    const completed=!!(result&&result.home_score!=null&&result.away_score!=null);
    return isCurrentPlayer||completed?`${prediction.home_score}-${prediction.away_score}`:'*-*';
  }
  return{scorePrediction,buildWeeklyRanking,visiblePredictionScore};
});

if(typeof document!=='undefined'&&!document.querySelector('script[data-bizim-integration-loader]')){
  const loader=document.createElement('script');
  loader.src='ui-integration-loader.js';
  loader.defer=true;
  loader.dataset.bizimIntegrationLoader='1';
  document.head.appendChild(loader);
}

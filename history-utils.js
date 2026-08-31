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
    const sorted=rows.slice().sort((a,b)=>b.points-a.points||b.exact-a.exact||b.correct-a.correct||a.name.localeCompare(b.name,'tr'));
    let previousKey=null,rank=0;
    return sorted.map((row,index)=>{const key=`${row.points}|${row.exact}|${row.correct}`;if(key!==previousKey){rank=index+1;previousKey=key}return{...row,rank}});
  }
  function visiblePredictionScore(prediction,result,isCurrentPlayer){
    if(!prediction)return'';
    const completed=!!(result&&result.home_score!=null&&result.away_score!=null);
    return isCurrentPlayer||completed?`${prediction.home_score}-${prediction.away_score}`:'*-*';
  }
  return{scorePrediction,buildWeeklyRanking,visiblePredictionScore};
});

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorOpportunity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const SUPER_FIXTURE_ID=30,SUPER_WEEK=4,CHAMPIONS_FIXTURE_ID=3,CHAMPIONS_WEEK=1;
  const outcome=(h,a)=>+h>+a?'1':+h<+a?'2':'X';
  const basePoints=(prediction,result)=>{if(!prediction||!result||result.home_score==null||result.away_score==null)return 0;const exact=+prediction.home_score===+result.home_score&&+prediction.away_score===+result.away_score;const correct=outcome(prediction.home_score,prediction.away_score)===outcome(result.home_score,result.away_score);return exact?4:correct?1:0};
  function isSuperOpportunity(value){const id=+((value&&value.fixture_id)??(value&&value.id)??value),week=value&&value.week!=null?+value.week:null;return id===SUPER_FIXTURE_ID&&(week==null||week===SUPER_WEEK)}
  function isChampionsOpportunity(value){const id=+((value&&value.fixture_id)??(value&&value.id)??value),week=value&&value.week!=null?+value.week:null;return id===CHAMPIONS_FIXTURE_ID&&(week==null||week===CHAMPIONS_WEEK)}
  function pointsForSuper(prediction,result){const base=basePoints(prediction,result);return isSuperOpportunity(prediction)?base*2:base}
  function pointsForChampions(prediction,result){const base=basePoints(prediction,result);return isChampionsOpportunity(prediction)?base*2:base}
  function pointsFor(prediction,result){return pointsForSuper(prediction,result)}
  return{SUPER_FIXTURE_ID,SUPER_WEEK,CHAMPIONS_FIXTURE_ID,CHAMPIONS_WEEK,isSuperOpportunity,isChampionsOpportunity,isOpportunityFixture:isSuperOpportunity,pointsForSuper,pointsForChampions,pointsFor};
});

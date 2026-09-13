(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorOpportunity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const SUPER_FIXTURES=[{id:44,week:5},{id:49,week:6}],CHAMPIONS_FIXTURE_ID=33,CHAMPIONS_WEEK=2,NATIONS_WEEK1_FIXTURE_ID=9006,NATIONS_WEEK2_FIXTURE_ID=9014;
  const SUPER_FIXTURE_ID=49,SUPER_WEEK=6;
  const outcome=(h,a)=>+h>+a?'1':+h<+a?'2':'X';
  const basePoints=(prediction,result)=>{if(!prediction||!result||result.home_score==null||result.away_score==null)return 0;const exact=+prediction.home_score===+result.home_score&&+prediction.away_score===+result.away_score;const correct=outcome(prediction.home_score,prediction.away_score)===outcome(result.home_score,result.away_score);return exact?4:correct?1:0};
  function fixtureId(value){return +((value&&value.fixture_id)??(value&&value.id)??value)}
  function fixtureWeek(value){return value&&value.week!=null?+value.week:null}
  function isSuperOpportunity(value){const id=fixtureId(value),week=fixtureWeek(value);return SUPER_FIXTURES.some(x=>id===x.id&&(week==null||week===x.week))}
  function isChampionsOpportunity(value){const id=fixtureId(value),week=fixtureWeek(value);return id===CHAMPIONS_FIXTURE_ID&&(week==null||week===CHAMPIONS_WEEK)}
  function isNationsOpportunity(value){const id=fixtureId(value),week=fixtureWeek(value);return id===NATIONS_WEEK1_FIXTURE_ID&&(week==null||week===1)||id===NATIONS_WEEK2_FIXTURE_ID&&(week==null||week===2)}
  function pointsForSuper(prediction,result){const base=basePoints(prediction,result);return isSuperOpportunity(prediction)?base*2:base}
  function pointsForChampions(prediction,result){const base=basePoints(prediction,result);return isChampionsOpportunity(prediction)?base*2:base}
  function pointsForNations(prediction,result){const base=basePoints(prediction,result);return isNationsOpportunity(prediction)?base*2:base}
  function pointsFor(prediction,result,competition){if(competition==='champions'||competition==='champions_league')return pointsForChampions(prediction,result);if(competition==='nations'||competition==='nations_league')return pointsForNations(prediction,result);return pointsForSuper(prediction,result)}
  return{SUPER_FIXTURE_ID,SUPER_WEEK,SUPER_FIXTURES,CHAMPIONS_FIXTURE_ID,CHAMPIONS_WEEK,NATIONS_WEEK1_FIXTURE_ID,NATIONS_WEEK2_FIXTURE_ID,isSuperOpportunity,isChampionsOpportunity,isNationsOpportunity,isOpportunityFixture:isSuperOpportunity,pointsForSuper,pointsForChampions,pointsForNations,pointsFor};
});

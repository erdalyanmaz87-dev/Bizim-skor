(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorOpportunity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const OPPORTUNITY_FIXTURE_ID=30, OPPORTUNITY_WEEK=4;
  const outcome=(h,a)=>+h>+a?'1':+h<+a?'2':'X';
  function isOpportunityFixture(value){const id=+((value&&value.fixture_id)??(value&&value.id)??value);const week=value&&value.week!=null?+value.week:null;return id===OPPORTUNITY_FIXTURE_ID&&(week==null||week===OPPORTUNITY_WEEK)}
  function pointsFor(prediction,result){if(!prediction||!result||result.home_score==null||result.away_score==null)return 0;const exact=+prediction.home_score===+result.home_score&&+prediction.away_score===+result.away_score;const correct=outcome(prediction.home_score,prediction.away_score)===outcome(result.home_score,result.away_score);const base=exact?4:correct?1:0;return isOpportunityFixture(prediction)?base*2:base}
  return{OPPORTUNITY_FIXTURE_ID,OPPORTUNITY_WEEK,isOpportunityFixture,pointsFor};
});

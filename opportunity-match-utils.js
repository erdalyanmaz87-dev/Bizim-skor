(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorOpportunity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const SUPER_FIXTURES=[{id:30,week:4},{id:44,week:5},{id:49,week:6},{id:58,week:7},{id:118,week:8}],CHAMPIONS_FIXTURE_ID=33,CHAMPIONS_WEEK=2,NATIONS_WEEK1_FIXTURE_ID=9006,NATIONS_WEEK2_FIXTURE_ID=9014,NATIONS_WEEK3_FIXTURE_ID=9022,NATIONS_WEEK4_FIXTURE_ID=9030,NATIONS_WEEK5_FIXTURE_ID=9034,NATIONS_WEEK6_FIXTURE_ID=9044;
  const SUPER_FIXTURE_ID=118,SUPER_WEEK=8,registered={super_lig:new Set([30,44,49,58,118,127,135]),champions_league:new Set([33,42,65]),nations_league:new Set([9006,9014,9022,9030,9034,9044])};
  function selectMenuMatches(rows,rounds){const active=new Set((rounds||[]).map(row=>`${row.competition}:${Number(row.week)}`));return(rows||[]).filter(row=>active.has(`${row.competition}:${Number(row.week)}`))}
  function register(rows){for(const row of rows||[]){registered[row.competition]?.add(Number(row.fixture_id))}}
  const outcome=(h,a)=>+h>+a?'1':+h<+a?'2':'X';
  const scoring=typeof module==='object'&&module.exports?require('./scoring-version-utils.js'):root.BizimSkorScoring;
  const basePoints=(prediction,result,competition)=>scoring.basePoints(prediction,result,scoring.version(prediction,competition));
  function fixtureId(value){return +((value&&value.fixture_id)??(value&&value.id)??value)}
  function fixtureWeek(value){return value&&value.week!=null?+value.week:null}
  function isSuperOpportunity(value){const id=fixtureId(value),week=fixtureWeek(value);return registered.super_lig.has(id)||SUPER_FIXTURES.some(x=>id===x.id&&(week==null||week===x.week))}
  function isChampionsOpportunity(value){const id=fixtureId(value),week=fixtureWeek(value);return registered.champions_league.has(id)||id===CHAMPIONS_FIXTURE_ID&&(week==null||week===CHAMPIONS_WEEK)}
  function isNationsOpportunity(value){const id=fixtureId(value),week=fixtureWeek(value);return registered.nations_league.has(id)||id===NATIONS_WEEK1_FIXTURE_ID&&(week==null||week===1)||id===NATIONS_WEEK2_FIXTURE_ID&&(week==null||week===2)||id===NATIONS_WEEK3_FIXTURE_ID&&(week==null||week===3)||id===NATIONS_WEEK4_FIXTURE_ID&&(week==null||week===4)||id===NATIONS_WEEK5_FIXTURE_ID&&(week==null||week===5)||id===NATIONS_WEEK6_FIXTURE_ID&&(week==null||week===6)}
  function pointsForSuper(prediction,result){const base=basePoints(prediction,result,'super_lig');return isSuperOpportunity(prediction)?base*2:base}
  function pointsForChampions(prediction,result){const base=basePoints(prediction,result,'champions_league');return isChampionsOpportunity(prediction)?base*2:base}
  function pointsForNations(prediction,result){const base=basePoints(prediction,result,'nations_league');return isNationsOpportunity(prediction)?base*2:base}
  function pointsFor(prediction,result,competition){if(competition==='champions'||competition==='champions_league')return pointsForChampions(prediction,result);if(competition==='nations'||competition==='nations_league')return pointsForNations(prediction,result);return pointsForSuper(prediction,result)}
  return{register,selectMenuMatches,SUPER_FIXTURE_ID,SUPER_WEEK,SUPER_FIXTURES,CHAMPIONS_FIXTURE_ID,CHAMPIONS_WEEK,NATIONS_WEEK1_FIXTURE_ID,NATIONS_WEEK2_FIXTURE_ID,NATIONS_WEEK3_FIXTURE_ID,NATIONS_WEEK4_FIXTURE_ID,NATIONS_WEEK5_FIXTURE_ID,NATIONS_WEEK6_FIXTURE_ID,isSuperOpportunity,isChampionsOpportunity,isNationsOpportunity,isOpportunityFixture:isSuperOpportunity,pointsForSuper,pointsForChampions,pointsForNations,pointsFor};
});

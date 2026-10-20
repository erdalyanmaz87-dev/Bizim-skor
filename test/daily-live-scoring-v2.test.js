const test=require('node:test');
const assert=require('node:assert/strict');
const Daily=require('../daily-matches-utils.js');
for(const [competition,id] of [['super_lig',119],['champions_league',37],['nations_league',9033]]) {
 test(competition+' live points use exclusive 10/6/4/2 categories and matching icons',()=>{
  for(const [p,points,icon] of [[[3,1],10,'🎯'],[[4,2],6,'🥅'],[[4,0],4,'🔢'],[[1,0],2,'✅'],[[1,3],0,'❌']]) {
   const actual=Daily.predictionStatus({home:p[0],away:p[1]},{home:3,away:1},false,competition,{id});
   assert.equal(actual.points,points);assert.ok(actual.label.startsWith(icon));
  }
 });
}
test('current registered opportunity fixture doubles once without a stale daily flag',()=>{
 for(const [p,points,icon] of [[[3,1],20,'🎯'],[[4,2],12,'🥅'],[[4,0],8,'🔢'],[[1,0],4,'✅'],[[1,3],0,'❌']]){
  const actual=Daily.predictionStatus({home:p[0],away:p[1]},{home:3,away:1},false,'champions_league',{id:42});
  assert.equal(actual.points,points);assert.ok(actual.label.startsWith(icon));
 }
});
test('screenshot 0-2 prediction on final 1-2 shows two points without live wording',()=>{
 const actual=Daily.predictionStatus({home:0,away:2},{home:1,away:2},false,'champions_league',{id:37,live:{status:'FT'}});
 assert.deepEqual(actual,{kind:'result',points:2,label:'✅ Sadece sonuç • 2 puan'});
});
test('different correct draw uses the goal difference category',()=>{
 const actual=Daily.predictionStatus({home:2,away:2},{home:1,away:1},false,'champions_league',{id:38});
 assert.equal(actual.points,6);assert.ok(actual.label.startsWith('🥅'));
});
test('unavailable scores are never interpreted as a 0-0 score',()=>{
 assert.equal(Daily.predictionStatus({home:0,away:0},{home:null,away:null},false,'champions_league',{id:37}),null);
});
test('legacy opportunity points are preserved',()=>{
 assert.equal(Daily.predictionStatus({home:2,away:1},{home:2,away:1},false,'champions_league',{id:33}).points,8);
});
test('fixture kickoff resolves the version for newly published unseeded fixtures',()=>{
 assert.equal(Daily.predictionStatus({home:3,away:1},{home:3,away:1},false,'champions_league',{id:99999,kickoff:'2026-10-21T19:00:00Z'}).points,10);
});
test('daily card passes fixture context through to the final score badge',()=>{
 const html=Daily.renderDailyMatchesMarkup({label:'Günün Maçları',matches:[{id:37,competition:'champions_league',kickoff:'2026-10-20T16:45:00Z',home_team:'Sabah',away_team:'Borussia Dortmund',my_prediction:{home:0,away:2},live:{status:'FT',home_score:1,away_score:2}}]},String);
 assert.match(html,/✅ Sadece sonuç • 2 puan/);
});

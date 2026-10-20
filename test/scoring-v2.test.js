const test=require('node:test');
const assert=require('node:assert/strict');
const opportunity=require('../opportunity-match-utils.js');

test('new scoring awards the highest matching tier, including draws',()=>{
 const r={home_score:2,away_score:1};
 for(const [h,a,expected] of [[2,1,10],[3,2,6],[3,0,4],[4,0,2],[1,2,0]]){
  assert.equal(opportunity.pointsForSuper({fixture_id:119,week:9,scoring_version:2,home_score:h,away_score:a},r),expected);
 }
 assert.equal(opportunity.pointsForChampions({fixture_id:37,scoring_version:2,home_score:2,away_score:2},{home_score:1,away_score:1}),6);
});
test('legacy scoring remains 4/1 and future opportunity awards exactly twice',()=>{
 assert.equal(opportunity.pointsForSuper({fixture_id:118,week:8,scoring_version:1,home_score:2,away_score:1},{home_score:2,away_score:1}),8);
 opportunity.register([{competition:'super_lig',fixture_id:119}]);
 for(const [h,a,expected] of [[2,1,20],[3,2,12],[3,0,8],[4,0,4],[1,2,0]]) assert.equal(opportunity.pointsForSuper({fixture_id:119,week:9,scoring_version:2,home_score:h,away_score:a},{home_score:2,away_score:1}),expected);
 assert.equal(opportunity.pointsForNations({fixture_id:9034,scoring_version:2,home_score:2,away_score:2},{home_score:1,away_score:1}),12);
});
test('missing predictions and results never become valid zero scores',()=>{
 assert.equal(opportunity.pointsForSuper({fixture_id:119,scoring_version:2,home_score:null,away_score:null},{home_score:0,away_score:0}),0);
});
test('fixture version is frozen and histories use the same new base score',()=>{
 const S=require('../scoring-version-utils.js'),H=require('../history-utils.js'),C=require('../champions-league-utils.js');
 assert.equal(S.version({fixture_id:118,scoring_version:1,kickoff:'2026-11-01T00:00:00Z'}),1);
 assert.equal(S.version({fixture_id:999999,kickoff:'2026-10-19T20:59:59Z'}),1);
 assert.equal(S.version({fixture_id:999999,kickoff:'2026-10-19T21:00:00Z'}),2);
 assert.equal(H.scorePrediction({fixture_id:119,home_score:3,away_score:2},{home_score:2,away_score:1}).points,6);
 assert.equal(C.scorePrediction({fixture_id:37,home_score:2,away_score:2},{home_score:1,away_score:1}).points,6);
 assert.equal(H.scorePrediction({fixture_id:110,home_score:2,away_score:1},{home_score:2,away_score:1}).points,4);
});

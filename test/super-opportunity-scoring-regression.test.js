const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const opportunity=require('../opportunity-match-utils.js');
const scoring=require('../opportunity-scoring-utils.js');
const general=require('../general-ranking-weekly-total.js');
function weekly(){const context={BizimSkorOpportunity:opportunity,document:{readyState:'complete',addEventListener(){},getElementById(){return null}},setTimeout(){}};context.globalThis=context;vm.runInNewContext(fs.readFileSync('weekly-ranking-score-fix.js','utf8'),context);return context.BizimSkorWeeklyRankingScoreFix}
const result={fixture_id:58,home_score:0,away_score:3};
for(const [label,prediction,expected] of [['exact',{home_score:0,away_score:3},8],['result',{home_score:1,away_score:2},2],['wrong',{home_score:1,away_score:0},0]]){
  const p={...prediction,player_name:'Test',fixture_id:58,week:7};
  test(`Trabzon opportunity ${label}: weekly ranking awards ${expected}`,()=>assert.equal(weekly().rows([p],[result])[0].pts,expected));
  test(`Trabzon opportunity ${label}: general calculation awards ${expected}`,()=>assert.equal(general.calculateRows([p],[result])[0].pts,expected));
  test(`Trabzon opportunity ${label}: shared scoring awards ${expected}`,()=>assert.equal(scoring.score({id:58,week:7},p,result).points,expected));
}
test('ordinary exact prediction remains four points',()=>assert.equal(weekly().points({fixture_id:57,week:7,home_score:0,away_score:3},result),4));
test('historical opportunity and dynamically registered opportunity keep double scoring',()=>{opportunity.register([{competition:'super_lig',fixture_id:200}]);for(const [id,week] of [[30,4],[44,5],[200,9]]){const p={fixture_id:id,week,home_score:0,away_score:3};assert.equal(weekly().points(p,result),8);assert.equal(scoring.score({id,week},p,result).points,8);assert.equal(general.pointsFor(p,result).points,8)}});

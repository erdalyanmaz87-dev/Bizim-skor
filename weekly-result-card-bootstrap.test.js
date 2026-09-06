const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {latestCompletedWeek,findPlayerRow,selectCardWeek}=require('./weekly-result-card-bootstrap');

test('latestCompletedWeek returns latest week with every fixture finished',()=>{
 const fixtures=[{id:1,week:4},{id:2,week:4},{id:3,week:5},{id:4,week:5}];
 const results=[{fixture_id:1,home_score:1,away_score:0},{fixture_id:2,home_score:0,away_score:0},{fixture_id:3,home_score:2,away_score:1}];
 assert.equal(latestCompletedWeek(fixtures,results),4);
});

test('selectCardWeek keeps completed week 4 visible after week 5 starts',()=>{
 const fixtures=[{id:1,week:4},{id:2,week:4},{id:3,week:5},{id:4,week:5}];
 const results=[{fixture_id:1,home_score:1,away_score:0},{fixture_id:2,home_score:0,away_score:0},{fixture_id:3,home_score:2,away_score:1}];
 assert.equal(selectCardWeek(fixtures,results),4);
});

test('findPlayerRow matches Turkish names case-insensitively',()=>{
 assert.deepEqual(findPlayerRow([{name:'İpek',pts:8,rank:2}],'ipek'),{name:'İpek',pts:8,rank:2});
});

test('weekly result bootstrap mounts a compact trigger and hidden modal instead of an always-visible card',()=>{
 const source=fs.readFileSync(require.resolve('./weekly-result-card-bootstrap'),'utf8');
 assert.match(source,/bsWeeklyResultTrigger/);
 assert.match(source,/bsWeeklyResultModal/);
 assert.doesNotMatch(source,/shell\.innerHTML=`\$\{host\.BizimSkorWeeklyResultCard\.renderWeeklyResultCard\(model\)\}/);
});

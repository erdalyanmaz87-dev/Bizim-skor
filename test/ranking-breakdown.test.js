const {test}=require('node:test');
const assert=require('node:assert/strict');
const ui=require('../ranking-breakdown-ui.js');
test('one exclusive scoring category per prediction, including inexact draws',()=>{
 for(const [p,r,want] of [[[2,1],[2,1],'exact_hits'],[[2,2],[1,1],'difference_hits'],[[3,1],[2,0],'difference_hits'],[[3,0],[2,1],'total_hits'],[[1,0],[3,1],'result_hits'],[[0,1],[1,0],null]])
  assert.equal(ui.category({home_score:p[0],away_score:p[1]},{home_score:r[0],away_score:r[1]}),want);
});
test('seven compact headers and a four-category fixed legend',()=>{
 assert.deepEqual(ui.columns.map(x=>x.icon),['🎯','🥅','🔢','✅']);
 const html=ui.legendMarkup();
 for(const word of ['Tam skor','Sonuç + fark','Sonuç + toplam','Sadece sonuç','×2'])assert.ok(html.includes(word));
 assert.equal(ui.columns.length+3,7);
});
test('requests isolate competition, week and private league without changing rank or points',()=>{
 assert.deepEqual(ui.requestArgs({competition:'nations_league',week:5},null),{p_competition:'nations_league',p_season:'2026/27',p_week:5,p_friend_league_id:null,p_token:null});
 assert.equal(ui.requestArgs({competition:'super_lig',friendLeagueId:'private'},'token').p_token,'token');
 assert.notEqual(ui.contextKey({competition:'super_lig',week:8}),ui.contextKey({competition:'super_lig',week:9}));
});

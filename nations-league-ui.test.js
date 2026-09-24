const test=require('node:test');
const assert=require('node:assert/strict');
const ui=require('./nations-league-ui.js');

test('genel Uluslar Ligi profili sonuç girilmiş son haftayı açar',()=>{
  const week=ui.selectRankingContextWeek([
    {week:1,rows:[{real_home:2,real_away:0}]},
    {week:2,rows:[{real_home:null,real_away:null}]}
  ]);
  assert.equal(week,1);
  assert.match(ui.tableMarkup([{league_rank:1,player_name:'İpek',points:4,exact_count:1,correct_count:1}],week),/data-profile-week="1"/);
});

test('yeni haftada sonuç oluşunca genel profil otomatik o haftaya geçer',()=>{
  assert.equal(ui.selectRankingContextWeek([
    {week:1,rows:[{real_home:2,real_away:0}]},
    {week:2,rows:[{real_home:1,real_away:1}]}
  ]),2);
});

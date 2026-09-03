const test=require('node:test');
const assert=require('node:assert/strict');
const rankingWeek=require('../current-ranking-week.js');

const fixtures=[
  {id:21,week:3},
  {id:28,week:4},
  {id:29,week:4}
];

test('yeni haftada sonuç yokken sonuçlanan son haftayı seçer',()=>{
  const results=[{fixture_id:21,home_score:2,away_score:1}];
  assert.equal(rankingWeek.latestScoredWeek(fixtures,results),3);
});

test('yeni haftanın ilk sonucu gelince o haftaya geçer',()=>{
  const results=[
    {fixture_id:21,home_score:2,away_score:1},
    {fixture_id:28,home_score:1,away_score:0}
  ];
  assert.equal(rankingWeek.latestScoredWeek(fixtures,results),4);
  assert.equal(rankingWeek.label(4),'4. Hafta Süper Lig Sıralaması');
});

test('skoru tamamlanmamış kayıt yeni haftayı başlatmaz',()=>{
  const results=[
    {fixture_id:21,home_score:2,away_score:1},
    {fixture_id:28,home_score:null,away_score:null}
  ];
  assert.equal(rankingWeek.latestScoredWeek(fixtures,results),3);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const U=require('../two-week-predictions-utils.js');

test('en yeni iki haftayı artan sırayla seçer',()=>{
  assert.deepEqual(U.selectVisibleWeeks([{week:2},{week:3},{week:4},{week:4}]),[3,4]);
});

test('haftalar kendi ilk maçlarında bağımsız kilitlenir',()=>{
  const fixtures=[
    {week:3,kickoff:'2026-08-28T18:30:00Z'},
    {week:4,kickoff:'2026-09-04T17:00:00Z'}
  ];
  const now=Date.parse('2026-08-31T12:00:00Z');
  assert.equal(U.isWeekLocked(fixtures,3,now),true);
  assert.equal(U.isWeekLocked(fixtures,4,now),false);
  assert.equal(U.defaultPredictionWeek(fixtures,[3,4],now),4);
});

test('iki hafta de açıksa daha erken oynanacak haftayı seçer',()=>{
  const fixtures=[
    {week:4,kickoff:'2026-09-04T17:00:00Z'},
    {week:5,kickoff:'2026-09-11T17:00:00Z'}
  ];
  assert.equal(U.defaultPredictionWeek(fixtures,[4,5],Date.parse('2026-09-01T12:00:00Z')),4);
});

test('tam skor adlarını ve doğru sonuç toplamını ayırır',()=>{
  const result={home_score:2,away_score:1};
  const predictions=[
    {player_name:'Ali',home_score:2,away_score:1},
    {player_name:'Ayşe',home_score:3,away_score:1},
    {player_name:'Pasif',home_score:2,away_score:1},
    {player_name:'Mehmet',home_score:1,away_score:1}
  ];
  assert.deepEqual(U.summarizeFixturePrediction(result,predictions,new Set(['ali','ayşe','mehmet'])),{
    exactNames:['Ali'],correctResultCount:2
  });
});

test('sonuçlanmamış maç için kesin bilen özeti üretmez',()=>{
  assert.deepEqual(U.summarizeFixturePrediction(null,[],new Set()),{exactNames:[],correctResultCount:0});
});

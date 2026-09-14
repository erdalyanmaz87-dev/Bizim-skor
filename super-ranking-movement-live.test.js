const test=require('node:test');
const assert=require('node:assert/strict');
const Live=require('./super-ranking-movement-live');

test('genel siralamada onceki ve mevcut sira farkindan hareket hesaplar',()=>{
  assert.deepEqual(Live.movement(25,21),{direction:'up',amount:4});
  assert.deepEqual(Live.movement(21,22),{direction:'down',amount:1});
  assert.equal(Live.movement(10,10),null);
});

test('haftalik hareket sadece sonucun ait oldugu hafta icin uygulanir',()=>{
  assert.deepEqual(Live.movementForContext({scope:'weekly',resultWeek:5,selectedWeek:5,beforeRank:26,currentRank:19}),{direction:'up',amount:7});
  assert.equal(Live.movementForContext({scope:'weekly',resultWeek:5,selectedWeek:4,beforeRank:26,currentRank:19}),null);
});

test('sunucu satirlarini kapsam ve oyuncuya gore indeksler',()=>{
  const idx=Live.indexRows([
    {movement_scope:'general',week:5,player_name:'Kat',before_rank:25},
    {movement_scope:'weekly',week:5,player_name:'Kat',before_rank:26}
  ]);
  assert.equal(idx.general.get('kat').beforeRank,25);
  assert.equal(idx.weekly.get('kat').beforeRank,26);
  assert.equal(idx.resultWeek,5);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const Daily=require('./daily-matches-utils');

test('normal maçta tam skor 4, doğru sonuç 1 puan gösterir',()=>{
  assert.deepEqual(Daily.predictionStatus({home:2,away:1},{home:2,away:1},false),{kind:'exact',points:4,label:'🎯 Skor doğru • 4 puan'});
  assert.deepEqual(Daily.predictionStatus({home:1,away:0},{home:2,away:1},false),{kind:'result',points:1,label:'✅ Sonuç doğru • 1 puan'});
});

test('fırsat maçında tam skor 8, doğru sonuç 2 puan gösterir',()=>{
  assert.equal(Daily.predictionStatus({home:2,away:1},{home:2,away:1},true).points,8);
  assert.equal(Daily.predictionStatus({home:1,away:0},{home:2,away:1},true).points,2);
});

test('başlamamış maçta sadece oyuncunun tahminini gösterir',()=>{
  assert.equal(Daily.renderMyPrediction({home:1,away:2},null,false),'👤 Sizin tahmininiz: <b>1 - 2</b>');
});

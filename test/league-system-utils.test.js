const test=require('node:test');
const assert=require('node:assert/strict');
const League=require('../league-system-utils');

test('69 kişi içinde ilk sırayı 100 performansa çevirir',()=>{
  assert.equal(League.normalizePerformance(1,69),100);
});

test('69 kişi içinde son sırayı 0 performansa çevirir',()=>{
  assert.equal(League.normalizePerformance(69,69),0);
});

test('iki kişilik turda ilk 100 son 0 olur',()=>{
  assert.equal(League.normalizePerformance(1,2),100);
  assert.equal(League.normalizePerformance(2,2),0);
});

test('katılmadığı turu sıfır puan olarak üretmez',()=>{
  assert.equal(League.normalizePerformance(null,69),null);
});

test('iki turdan az oyuncuyu lig için uygun saymaz',()=>{
  assert.equal(League.isLeagueEligible(1),false);
  assert.equal(League.isLeagueEligible(2),true);
});

test('63 oyuncuyu 5 lige tam dağıtır',()=>{
  const c=League.allocateLeagueCapacities(63);
  assert.deepEqual(c,{champions:6,elite:9,gold:13,silver:16,bronze:19});
  assert.equal(Object.values(c).reduce((a,b)=>a+b,0),63);
});

test('komşu lig kontenjanlarını kapasiteyi koruyacak şekilde üretir',()=>{
  assert.deepEqual(League.promotionSlots({champions:6,elite:9,gold:13,silver:16,bronze:19}),{
    champions_elite:2,
    elite_gold:3,
    gold_silver:4,
    silver_bronze:5
  });
});

test('lig durumunu yükselme ve düşme hatlarına göre açıklar',()=>{
  assert.equal(League.describeLeagueStatus({rank:2,size:13,promotionSlots:3,relegationSlots:3,leagueCode:'gold'}).state,'promotion');
  assert.equal(League.describeLeagueStatus({rank:12,size:13,promotionSlots:3,relegationSlots:3,leagueCode:'gold'}).state,'relegation');
  assert.equal(League.describeLeagueStatus({rank:5,size:13,promotionSlots:3,relegationSlots:3,leagueCode:'gold'}).state,'safe');
  assert.equal(League.describeLeagueStatus({rank:1,size:6,promotionSlots:0,relegationSlots:2,leagueCode:'champions'}).state,'championship');
});

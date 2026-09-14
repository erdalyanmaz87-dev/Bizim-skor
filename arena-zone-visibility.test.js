const test=require('node:test');
const assert=require('node:assert/strict');
const zone=require('./arena-zone-visibility.js');

test('promotion and relegation are derived from rank, not stale row status',()=>{
  assert.equal(zone.zoneForRank(1,16,{promotion:4,relegation:5}),'promotion');
  assert.equal(zone.zoneForRank(4,16,{promotion:4,relegation:5}),'promotion');
  assert.equal(zone.zoneForRank(5,16,{promotion:4,relegation:5}),'none');
  assert.equal(zone.zoneForRank(11,16,{promotion:4,relegation:5}),'none');
  assert.equal(zone.zoneForRank(12,16,{promotion:4,relegation:5}),'relegation');
  assert.equal(zone.zoneForRank(16,16,{promotion:4,relegation:5}),'relegation');
});

test('movement text is parsed into locked promotion and relegation slots',()=>{
  assert.deepEqual(zone.parseTargets('⬆ İlk 4 yükselir • ⬇ Son 5 düşer'),{promotion:4,relegation:5});
  assert.deepEqual(zone.parseTargets('⬇ Son 2 düşer'),{promotion:0,relegation:2});
  assert.deepEqual(zone.parseTargets('⬆ İlk 3 yükselir'),{promotion:3,relegation:0});
});

test('zone labels clearly explain player movement',()=>{
  assert.equal(zone.zoneLabel('promotion'),'↑ Yükselir');
  assert.equal(zone.zoneLabel('relegation'),'↓ Düşer');
  assert.equal(zone.zoneLabel('none'),'');
});

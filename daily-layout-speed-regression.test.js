const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Live=require('./live-score-ui');

test('Uluslar Ligi canlı skor yönetiminde doğru adla görünür',()=>{
  assert.equal(Live.competitionLabel('nations_league'),'Uluslar Ligi');
});

test('ülke bayrağı dekoratörü markalanmış takım bileşenini tekrar işlemez',()=>{
  const source=fs.readFileSync('country-flags-ui.js','utf8');
  assert.match(source,/\.bs-team-brand/);
});

test('günlük tahminler sık yenilemede yeniden sorgulanmaz',()=>{
  const source=fs.readFileSync('daily-matches-utils.js','utf8');
  assert.match(source,/PREDICTION_CACHE_MS/);
  assert.match(source,/predictionCacheKey/);
});

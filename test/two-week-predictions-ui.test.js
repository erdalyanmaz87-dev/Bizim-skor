const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');

test('Ana Sayfa ve Tahmin Yap ayrı sekmelerdir',()=>{
  assert.match(html,/data-tab="home"[^>]*>Ana Sayfa</);
  assert.match(html,/data-tab="pred"[^>]*>Tahmin Yap</);
  assert.match(html,/<section id="home"/);
  assert.match(html,/<section id="pred"/);
});

test('iki haftalık yardımcı ve hafta seçimi yüklenir',()=>{
  assert.match(html,/<script src="two-week-predictions-utils\.js"><\/script>/);
  assert.match(html,/id="predictionWeekSelect"/);
  assert.match(html,/BizimSkorTwoWeek\.selectVisibleWeeks/);
  assert.match(html,/selectedPredictionWeek/);
});

test('tahminler seçili hafta için güvenli RPC ile kaydedilir',()=>{
  assert.match(html,/save_super_league_week_predictions/);
  assert.match(html,/p_week\s*:\s*selectedPredictionWeek/);
  assert.match(html,/p_token\s*:\s*localStorage\.getItem\('bizimSkorFriendToken'\)/);
  assert.doesNotMatch(html,/sb\.from\('predictions'\)\.upsert\(rows/);
});

test('hafta kilidi seçili haftanın kendi fikstüründen hesaplanır',()=>{
  assert.match(html,/BizimSkorTwoWeek\.isWeekLocked\(allFixtures\s*,\s*selectedPredictionWeek/);
  assert.match(html,/Bu haftanın tahmin süresi doldu/);
});

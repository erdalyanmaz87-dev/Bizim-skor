const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');

test('günlük maç kartı Tahmin Yap ekranının ilk kartıdır',()=>{
  const predictionStart=html.indexOf('<section id="pred">');
  const dailyCard=html.indexOf('id="dailyMatches"');
  const weekCard=html.indexOf('id="week"');
  assert.ok(predictionStart>=0&&dailyCard>predictionStart&&dailyCard<weekCard);
});

test('fikstür yüklenince günlük maç kartı oluşturulur',()=>{
  assert.match(html,/daily-matches-utils\.js/);
  assert.match(html,/BizimSkorDailyMatches\.selectDailyMatches\(q\.data\|\|\[\]\)/);
  assert.match(html,/BizimSkorDailyMatches\.renderDailyMatchesMarkup/);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');

test('4. hafta ayrı ana menü kutusu yerine hafta seçicisindedir',()=>{
  assert.match(html,/<option value="4">4\. Hafta<\/option>/);
  assert.doesNotMatch(html,/function prepareWeek4Board\(\)/);
  assert.doesNotMatch(html,/section\.id='week4Rank'/);
});

test('haftalık sıralama ekranında uzun katılımcı tahminleri yoktur',()=>{
  assert.doesNotMatch(html,/4\. Hafta Katılımcı Tahminleri/);
  assert.match(html,/section\.innerHTML='<div class="c"><h2 id="weeklyRankingTitle"/);
  assert.match(html,/if\(b\.dataset\.tab==='weeklyRankings'\)await loadWeeklyRanking/);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');

test('menüde ayrı 4. hafta sıralaması bulunur',()=>{
  assert.match(html,/function prepareWeek4Board\(\)/);
  assert.match(html,/dataset\.tab='week4Rank'/);
  assert.match(html,/textContent='4\. Hafta Sıralaması'/);
  assert.match(html,/section\.id='week4Rank'/);
});

test('4. hafta sıralaması ve maç bazlı bilen özeti yüklenir',()=>{
  assert.match(html,/id="week4Board"/);
  assert.match(html,/id="week4MatchSummaries"/);
  assert.match(html,/async function loadWeek4Board\(\)/);
  assert.match(html,/\.eq\('week',4\)/);
  assert.match(html,/renderScoreTable\('week4Board'/);
  assert.match(html,/renderMatchPredictionSummaries\('week4MatchSummaries'/);
});

test('4. hafta ekranında uzun katılımcı tahminleri yoktur',()=>{
  assert.doesNotMatch(html,/4\. Hafta Katılımcı Tahminleri/);
  assert.match(html,/if\(b\.dataset\.tab==='week4Rank'\)await loadWeek4Board\(\)/);
});

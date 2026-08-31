const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');

test('haftalık sıralama ekranı 3. haftayı gösterir',()=>{
  assert.match(html,/liveTab\.textContent='3\. Hafta Sıralaması'/);
  assert.match(html,/textContent='🏆 3\. Hafta Sıralaması'/);
  assert.match(html,/textContent='👥 3\. Hafta Katılımcı Tahminleri'/);
  assert.match(html,/if\(b\.dataset\.tab==='live'\)await loadWeek3Board\(\)/);
});

test('3. hafta verileri ve maç bilenleri ayrı alanda yüklenir',()=>{
  assert.match(html,/mount\.id='week3MatchSummaries'/);
  assert.match(html,/async function loadWeek3Board\(\)/);
  assert.match(html,/\.eq\('week',3\)/);
  assert.match(html,/renderMatchPredictionSummaries\('week3MatchSummaries'/);
});

test('tam skor isimleri ve doğru sonuç sayısı kullanıcı diliyle gösterilir',()=>{
  assert.match(html,/Doğru skor tahmini yapanlar:/);
  assert.match(html,/Doğru sonucu bilen:/);
  assert.match(html,/BizimSkorTwoWeek\.summarizeFixturePrediction/);
  assert.doesNotMatch(html,/1-X-2/);
});

test('geçmiş ve haftanın sonuçları haftaları veriden üretmeye devam eder',()=>{
  assert.match(html,/new Set\(historyMine\.map\(p=>p\.week\)\)/);
  assert.match(html,/new Set\(\(fq\.data\|\|\[\]\)\.map\(f=>\+f\.week\)\)/);
});

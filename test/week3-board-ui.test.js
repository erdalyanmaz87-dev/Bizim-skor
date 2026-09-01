const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');

test('ana menü haftalık sıralamaları tek ekranda toplar',()=>{
  assert.match(html,/liveTab\.dataset\.tab='weeklyRankings'/);
  assert.match(html,/liveTab\.textContent='Haftalık Sıralamalar'/);
  assert.match(html,/section\.id='weeklyRankings'/);
  assert.match(html,/id="weeklyRankingWeekSelect"/);
  assert.doesNotMatch(html,/dataset\.tab='week4Rank'/);
});

test('hafta seçicisinde 2, 3 ve 4. hafta bulunur',()=>{
  assert.match(html,/<option value="2">2\. Hafta<\/option>/);
  assert.match(html,/<option value="3" selected>3\. Hafta<\/option>/);
  assert.match(html,/<option value="4">4\. Hafta<\/option>/);
  assert.match(html,/weeklyRankingWeekSelect\.onchange=\(\)=>loadWeeklyRanking\(\+weeklyRankingWeekSelect\.value\)/);
});

test('seçilen haftanın sıralaması ve maç bilenleri aynı alanda yüklenir',()=>{
  assert.match(html,/async function loadWeeklyRanking\(selectedWeek=3\)/);
  assert.match(html,/\.eq\('week',selectedWeek\)/);
  assert.match(html,/renderScoreTable\('weeklyRankingBoard'/);
  assert.match(html,/renderMatchPredictionSummaries\('weeklyRankingMatchSummaries'/);
  assert.match(html,/weeklyRankingTitle\.textContent=`🏆 \$\{selectedWeek\}\. Hafta Sıralaması`/);
});

test('tam skor isimleri ve doğru sonuç sayısı kullanıcı diliyle gösterilir',()=>{
  assert.match(html,/Doğru skor tahmini yapanlar:/);
  assert.match(html,/Doğru sonucu bilen:/);
  assert.match(html,/summary\.correctResultCount/);
  assert.doesNotMatch(html,/1-X-2/);
});

test('geçmiş ve haftanın sonuçları haftaları veriden üretmeye devam eder',()=>{
  assert.match(html,/new Set\(historyMine\.map\(p=>p\.week\)\)/);
  assert.match(html,/new Set\(\(fq\.data\|\|\[\]\)\.map\(f=>\+f\.week\)\)/);
});

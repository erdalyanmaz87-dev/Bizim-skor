const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');

test('ana sayfadaki haftalık kişisel sıra sonuçlanan son haftayı kullanır',()=>{
  assert.match(html,/current-ranking-week\.js/);
  assert.match(html,/latestScoredWeek/);
  assert.match(html,/personalWeekRankLabel/);
});

test('4. hafta tamamlanana kadar Sezu sırası gösterilir',()=>{
  assert.match(html,/week4Complete=/);
  assert.match(html,/specialLabel\.textContent='Sezu sıram'/);
  assert.match(html,/\.in\('week',\[3,4\]\)/);
});

test('4. hafta tamamlanınca kişisel kart Şampiyonlar Ligi sırasına dönüşür',()=>{
  assert.match(html,/specialLabel\.textContent='Şampiyonlar Ligi sıram'/);
  assert.match(html,/get_champions_league_ranking/);
  assert.match(html,/league_rank/);
});

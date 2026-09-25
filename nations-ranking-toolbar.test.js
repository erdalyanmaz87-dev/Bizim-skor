const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Uluslar Ligi genel sıralaması yüklendikten sonra ortak Ana Sayfa ve Kendimi Gör araç çubuğunu yeniler',()=>{
  const source=fs.readFileSync('nations-league-ui.js','utf8');
  const loadRanking=source.match(/async function loadRanking\(\)[\s\S]*?(?=\nfunction openRanking)/)?.[0]||'';

  assert.match(loadRanking,/board\.innerHTML=tableMarkup\(ranking\.data\|\|\[\],context\.week\)/);
  assert.match(loadRanking,/BizimSkorFindMyRanking\?\.refresh\?\.\(\)/);
});

test('genel sıralamadaki her oyuncu sonuç girilmiş son haftayı taşır',()=>{
  const nations=require('./nations-league-ui.js');
  const html=nations.tableMarkup([
    {league_rank:1,player_name:'Erdal',points:9,exact_count:2,correct_count:3},
    {league_rank:2,player_name:'İpek',points:7,exact_count:1,correct_count:4}
  ],1);

  assert.match(html,/data-player-name="Erdal" data-profile-week="1" data-profile-kind="nations"/);
  assert.match(html,/data-player-name="İpek" data-profile-week="1" data-profile-kind="nations"/);
});

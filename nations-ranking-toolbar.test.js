const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Uluslar Ligi genel sıralaması yüklendikten sonra ortak Ana Sayfa ve Kendimi Gör araç çubuğunu yeniler',()=>{
  const source=fs.readFileSync('nations-league-ui.js','utf8');
  const loadRanking=source.match(/async function loadRanking\(\)[\s\S]*?(?=\nfunction openRanking)/)?.[0]||'';

  assert.match(loadRanking,/board\.innerHTML=tableMarkup\(ranking\.data\|\|\[\],week\)/);
  assert.match(loadRanking,/BizimSkorFindMyRanking\?\.refresh\?\.\(\)/);
});

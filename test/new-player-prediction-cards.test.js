const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');
const cards=fs.readFileSync('prediction-week-cards.js','utf8');
const priority=fs.readFileSync('home-prediction-priority.js','utf8');

test('yeni oyuncu oturumu açılınca tahmin kutuları yeniden yüklenir',()=>{
  assert.match(html,/dispatchEvent\(new Event\('bizimskor:session-ready'\)\)/);
  assert.match(cards,/addEventListener\?\.\('bizimskor:session-ready',refresh\)/);
  assert.match(priority,/addEventListener\?\.\('bizimskor:session-ready',refresh\)/);
});

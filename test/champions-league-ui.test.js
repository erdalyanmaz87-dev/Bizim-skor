const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
let ui='';
try{ui=fs.readFileSync(path.join(__dirname,'../champions-league-ui.js'),'utf8')}catch{}

test('Şampiyonlar Ligi tahmin bölümü tahmin menüsünden açılır',()=>{
  assert.match(ui,/function openPrediction\(\)/);
  assert.match(ui,/id="championsPred"/);
  assert.match(html,/champions-league-ui\.js/);
  assert.match(html,/champions-league-utils\.js/);
  assert.match(ui,/save_champions_league_predictions/);
});

test('Şampiyonlar Ligi tahmin ekranı güvenli RPC ile yüklenir',()=>{
  assert.match(ui,/get_champions_league_week/);
  assert.match(ui,/bizimSkorFriendToken/);
  assert.match(ui,/validateWeeklyScores/);
  assert.match(ui,/id="championsFixtures"/);
  assert.match(ui,/id="championsSave"/);
});

test('tema yalnız Şampiyonlar Ligi alanına uygulanır',()=>{
  assert.match(html,/\.champions-shell/);
  assert.match(html,/\.champions-shell\s*\{/);
  assert.doesNotMatch(html,/body\s*\{[^}]*background\s*:\s*#061a/i);
});

test('Şampiyonlar Ligi sıralaması bağımsız sekmedir',()=>{
  assert.match(ui,/data-tab="championsRanking"/);
  assert.match(ui,/id="championsRanking"/);
  assert.match(ui,/id="championsRankingBoard"/);
  assert.match(ui,/get_champions_league_ranking/);
  assert.match(ui,/get_champions_league_week_predictions/);
});

test('Şampiyonlar Ligi sıralaması Süper Lig tablolarını kullanmaz',()=>{
  const rankingSource=ui.match(/async function loadRanking\(\)[\s\S]*?(?=\n\s*async function loadHistory)/)?.[0]||'';
  assert.doesNotMatch(rankingSource,/\.from\(['"](?:fixtures|predictions|results)['"]\)/);
  assert.match(rankingSource,/get_champions_league_ranking/);
  assert.match(ui,/const prediction=row\.predicted_home==null\|\|row\.predicted_away==null\?null/);
  assert.match(ui,/Tahmin bulunamadı/);
});

test('açık sıralama sonucu güvenli RPC üzerinden yeniler',()=>{
  assert.match(ui,/setInterval\([\s\S]*loadRanking\(\)/);
  assert.match(ui,/document\.visibilityState==='visible'/);
});

test('seçili Şampiyonlar Ligi sekmesi görsel olarak ayrılır',()=>{
  assert.match(html,/\.champions-tab\.active\{/);
});

test('süresi dolan oturum yeniden giriş mesajına döner',()=>{
  assert.match(ui,/function isSessionError/);
  assert.match(ui,/localStorage\.removeItem\('bizimSkorFriendToken'\)/);
  assert.match(ui,/Önce mevcut oyuncu hesabınla giriş yap\./);
});

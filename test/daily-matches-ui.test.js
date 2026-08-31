const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const dailyLoader=html.slice(html.indexOf('async function loadDailyMatches()'),html.indexOf("window.addEventListener('load',loadDailyMatches)"));

test('günlük maç kartı Ana Sayfa ekranının ilk kartıdır',()=>{
  const predictionStart=html.indexOf('<section id="home">');
  const dailyCard=html.indexOf('id="dailyMatches"');
  const accountCard=html.indexOf('id="knownPlayer"');
  assert.ok(predictionStart>=0&&dailyCard>predictionStart&&dailyCard<accountCard);
});

test('fikstür yüklenince günlük maç kartı oluşturulur',()=>{
  assert.match(html,/daily-matches-utils\.js/);
  assert.match(dailyLoader,/id:row\.fixture_id/);
  assert.match(dailyLoader,/BizimSkorDailyMatches\.selectDailyMatches\(matches\)/);
  assert.match(html,/BizimSkorDailyMatches\.renderDailyMatchesMarkup/);
});

test('günlük kart güvenli canlı skor RPCsi ve sessiz gol vurgusunu kullanır',()=>{
  assert.match(html,/live-score-ui\.js/);
  assert.match(html,/get_today_live_match_cards/);
  assert.match(html,/live-exact-ticker/);
  assert.match(html,/goal-flash/);
  assert.doesNotMatch(html,/<audio|new Audio\(|\.play\(/i);
});

test('günlük kart korumalı fikstür tablolarını tarayıcıdan doğrudan okumaz',()=>{
  assert.doesNotMatch(dailyLoader,/sb\.from\(['"]fixtures['"]\)/);
  assert.doesNotMatch(dailyLoader,/sb\.from\(['"]champions_league_fixtures['"]\)/);
  assert.match(dailyLoader,/sb\.rpc\(['"]get_today_live_match_cards['"]/);
});


test('canlı maç kartı açık ekranda ve uygulamaya dönünce kendiliğinden yenilenir',()=>{
  assert.match(html,/setInterval\([\s\S]*loadDailyMatches\(\)[\s\S]*30000\)/);
  assert.match(html,/document\.addEventListener\(['"]visibilitychange['"][\s\S]*loadDailyMatches\(\)/);
  assert.match(html,/window\.addEventListener\(['"]focus['"][\s\S]*loadDailyMatches\(\)/);
});

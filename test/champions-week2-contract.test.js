const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('Champions League active prediction week is week 2 everywhere',()=>{
  const champions=read('champions-league-ui.js');
  const priority=read('home-prediction-priority.js');
  assert.match(champions,/const season='2026\/27',week=2;/);
  assert.match(champions,/Şampiyonlar Ligi • 2\. Hafta/);
  assert.match(priority,/week:2/);
  assert.match(priority,/p_week:2/);
  assert.match(priority,/Şampiyonlar Ligi 2\. Hafta/);
});

test('Champions League week 2 opportunity match is Manchester City - PSG',()=>{
  const ui=read('opportunity-match-ui.js');
  const utils=read('opportunity-match-utils.js');
  assert.match(ui,/CL_HOME='Manchester City',CL_AWAY='PSG'/);
  assert.match(utils,/CHAMPIONS_WEEK=2/);
});

test('Champions League prediction UI exposes robot and statistics actions',()=>{
  const champions=read('champions-league-ui.js');
  assert.match(champions,/Robotun Önerisi/);
  assert.match(champions,/Maç İstatistikleri/);
  assert.match(champions,/get_champions_robot_predictions/);
  assert.match(champions,/get_champions_match_statistics/);
});

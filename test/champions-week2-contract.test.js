const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('Şampiyonlar Ligi aktif tahmin haftası her yerde 2 olur',()=>{
  const champions=read('champions-league-ui.js');
  const priority=read('home-prediction-priority.js');
  assert.match(champions,/const season='2026\/27',week=2(?:,|;)/);
  assert.match(champions,/Şampiyonlar Ligi • 2\. Hafta/);
  assert.match(priority,/week:2/);
  assert.match(priority,/p_week:2/);
  assert.match(priority,/Şampiyonlar Ligi 2\. Hafta/);
});

test('2. hafta fikstürü 18 benzersiz maçı doğru tarihlerle yükler',()=>{
  const sql=read('supabase/migrations/20260913003000_champions_league_week2.sql');
  const fixtureBlock=sql.match(/from \(values([\s\S]*?)\) as v\(season,week,home_team,away_team,kickoff\)/)?.[1]||'';
  const rows=[...fixtureBlock.matchAll(/\('2026\/27',2,'([^']+)','([^']+)','(2026-10-1[34] [^']+)'::timestamptz\)/g)];
  assert.equal(rows.length,18);
  assert.equal(new Set(rows.map(row=>row[1]+'|'+row[2])).size,18);
});

test('2. hafta fırsat maçı Manchester City - PSG olur',()=>{
  const ui=read('opportunity-match-ui.js');
  const utils=read('opportunity-match-utils.js');
  const sql=read('supabase/migrations/20260913003000_champions_league_week2.sql');
  assert.match(ui,/CL_HOME='Manchester City',CL_AWAY='PSG'/);
  assert.match(utils,/CHAMPIONS_WEEK=2/);
  assert.match(sql,/home_team='Manchester City' and f\.away_team='PSG'/);
});

test('tahmin ekranı robot önerisi ve maç istatistiklerini sunar',()=>{
  const champions=read('champions-league-ui.js');
  assert.match(champions,/Robotun Önerisi/);
  assert.match(champions,/Maç İstatistikleri/);
  assert.match(champions,/get_champions_robot_predictions/);
  assert.match(champions,/get_champions_match_statistics/);
});


test('Şampiyonlar Ligi maç araçları ortak yatay düzeni yalnız bir kez kullanır',()=>{
  const champions=read('champions-league-ui.js');
  const robot=read('robot-prediction-ui.js');
  const stats=read('match-statistics-ui.js');
  assert.doesNotMatch(champions,/data-champions-robot|champions-tools|Robotun Önerisi: \$\{/);
  assert.match(robot,/button\.textContent='🤖 Robotun Önerisi'/);
  assert.match(robot,/\.match-stats-button\{grid-column:1\/4/);
  assert.match(robot,/\.robot-prediction-button\{grid-column:4\/6/);
  assert.match(stats,/#championsFixtures \.champions-match/);
});

test('Şampiyonlar Ligi istatistik düğmesi kendi istatistik RPCsini kullanır',()=>{
  const stats=read('match-statistics-ui.js');
  assert.match(stats,/get_champions_match_statistics/);
  assert.match(stats,/kind==='champions'/);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('Şampiyonlar Ligi 2. hafta korunur ve yeni haftanın durumu dinamik gösterilir',()=>{
  const priority=require('../home-prediction-priority');
  assert.equal(priority.championsStatus(18,18).week,2);
  assert.equal(priority.championsStatus(0,18,null,3).week,3);
  assert.match(priority.championsStatus(0,18,null,3).text,/3\. Hafta/);
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
  assert.match(ui,/rpc\('get_opportunity_match_cards'\)/);
  assert.match(ui,/BizimSkorOpportunity\?\.register\?\.\(opportunityMenu\)/);
  assert.match(utils,/CHAMPIONS_WEEK=2/);
  assert.match(sql,/home_team='Manchester City' and f\.away_team='PSG'/);
});

test('tahmin ekranı ortak robot önerisi ve maç istatistikleri araçlarını kullanır',()=>{
  const robot=read('robot-prediction-ui.js');
  const stats=read('match-statistics-ui.js');
  assert.match(robot,/robot-prediction-button/);
  assert.match(robot,/competition\(settings\)/);
  assert.match(stats,/match-stats-button/);
  assert.match(stats,/\['#championsFixtures \.champions-match',championsFixtures,'champions'\]/);
});


test('Şampiyonlar Ligi maç araçları ortak yatay düzeni yalnız bir kez kullanır',()=>{
  const champions=read('champions-league-ui.js');
  const robot=read('robot-prediction-ui.js');
  const stats=read('match-statistics-ui.js');
  assert.doesNotMatch(champions,/data-champions-robot|champions-tools|Robotun Önerisi: \$\{/);
  assert.match(robot,/button\.textContent='🤖 ▶ Oynat bakalım'/);
  assert.match(robot,/\.prediction-action-row\{grid-column:1\/-1/);
  assert.match(robot,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(robot,/alignActionButtons\(row\)/);
  assert.match(stats,/\['#championsFixtures \.champions-match',championsFixtures,'champions'\]/);
});

test('Şampiyonlar Ligi istatistik düğmesi kendi istatistik RPCsini kullanır',()=>{
  const stats=read('match-statistics-ui.js');
  assert.match(stats,/get_champions_match_statistics/);
  assert.match(stats,/kind==='champions'/);
});

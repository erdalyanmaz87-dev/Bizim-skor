const test=require('node:test');
const assert=require('node:assert/strict');
const ui=require('./league-system-ui.js');

test('Arena koyu temada okunaklı yüzey ve metin renkleri üretir',()=>{
  const styles=ui.css();
  assert.match(styles,/html\[data-theme="dark"\] \.league-shell\{[^}]*background:#0f172a[^}]*color:#f8fafc/);
  assert.match(styles,/html\[data-theme="dark"\] \.league-table-head/);
  assert.match(styles,/html\[data-theme="dark"\] \.league-player/);
});

test('yükselme ve düşme bölgeleri koyu temada hem zemin hem sınırla ayrılır',()=>{
  const styles=ui.css();
  assert.match(styles,/html\[data-theme="dark"\] \.league-promotion-zone\{[^}]*background:rgba\(22,163,74,.22\)/);
  assert.match(styles,/html\[data-theme="dark"\] \.league-relegation-zone\{[^}]*background:rgba\(220,38,38,.20\)/);
  assert.match(styles,/html\[data-theme="dark"\] \.league-promotion-boundary\{[^}]*border-bottom:3px solid #22c55e/);
  assert.match(styles,/html\[data-theme="dark"\] \.league-relegation-boundary\{[^}]*border-top:3px solid #ef4444/);
});

test('Arena sıralaması sezon, dönem ve veri revizyonunu taşır',()=>{
  const html=ui.renderLeagueShell({league_code:'gold',period_no:2},[{player_name:'Ali',league_rank:1,performance_score:42,valid_round_count:3}],{});
  assert.match(html,/data-ranking-season="2026\/27"/);
  assert.match(html,/data-ranking-period="2"/);
  assert.match(html,/data-ranking-revision="2\|\|Ali:1:42:3"/);
});

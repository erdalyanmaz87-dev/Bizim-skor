const assert=require('assert');
const dashboard=require('./live-score-dashboard-ui.js');

const rows=[
  {competition:'super_lig',fixture_id:11,home_team:'Galatasaray',away_team:'Kasımpaşa',home_score:1,away_score:0,elapsed:37,status:'1H',kickoff:'2026-09-18T16:00:00Z'},
  {competition:'super_lig',fixture_id:12,home_team:'Fenerbahçe',away_team:'Göztepe',home_score:0,away_score:0,elapsed:0,status:'NS',kickoff:'2026-09-18T18:00:00Z'},
  {competition:'champions_league',fixture_id:13,home_team:'PSG',away_team:'Arsenal',home_score:2,away_score:2,elapsed:90,status:'FT',kickoff:'2026-09-18T14:00:00Z'}
];

const html=dashboard.renderDashboardMarkup(rows);
assert(!html.includes('id="adminLiveFixture"'),'dashboard must not require a fixture select');
assert(html.includes('data-admin-live-key="super_lig:11"'),'first match card must exist');
assert(html.includes('data-admin-live-key="super_lig:12"'),'second match card must exist');
assert(html.includes('data-admin-live-key="champions_league:13"'),'third match card must exist');
assert(html.includes('data-admin-score-minus="home"'),'home score minus button must exist');
assert(html.includes('data-admin-score-plus="away"'),'away score plus button must exist');
assert(html.includes('data-admin-live-save'),'each card must support saving');
assert(html.includes('data-admin-live-finish'),'each card must support finishing');
assert(html.includes('data-admin-live-elapsed'),'each card must expose elapsed minute input');
assert(html.includes('data-admin-live-save-all'),'dashboard must support bulk save');
assert(html.includes('CANLI'),'live match should be visibly marked');
assert(html.indexOf('Galatasaray')<html.indexOf('Fenerbahçe'),'live match should render before not-started match');
assert(html.indexOf('Fenerbahçe')<html.indexOf('PSG'),'finished match should render last');

console.log('live-score-dashboard contract ok');

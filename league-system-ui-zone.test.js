const test=require('node:test');
const assert=require('node:assert/strict');
const leagues=require('./league-system-ui.js');

test('promotion zones follow eligible movement decisions even beyond the raw rank cutoff',()=>{
  const rows=[
    {league_rank:1,player_name:'Birinci',performance_score:70,valid_round_count:2,promotion_status:'promotion'},
    {league_rank:2,player_name:'Şener Çetin',performance_score:65,valid_round_count:1,promotion_status:'none'},
    {league_rank:7,player_name:'Sokrates',performance_score:50,valid_round_count:2,promotion_status:'promotion'}
  ];
  const html=leagues.renderLeagueTable(rows,{league_code:'bronze',movement_targets:{promotion:6,relegation:0}});
  const classes=rank=>html.match(new RegExp('<div class="([^"]*)"[^>]*><span class="league-rank">'+rank+'<\\/span>'))?.[1]||'';
  assert.match(classes(1),/league-promotion-zone/);
  assert.doesNotMatch(classes(2),/league-promotion-zone/);
  assert.match(classes(7),/league-promotion-zone/);
  assert.match(classes(7),/league-promotion-boundary/);
});

test('relegation zones follow authoritative movement decisions',()=>{
  const rows=[
    {league_rank:1,player_name:'Bir',performance_score:60,valid_round_count:2,promotion_status:'none'},
    {league_rank:2,player_name:'İki',performance_score:59,valid_round_count:2,promotion_status:'none'},
    {league_rank:3,player_name:'Üç',performance_score:58,valid_round_count:2,promotion_status:'relegation'}
  ];
  const html=leagues.renderLeagueTable(rows,{league_code:'champions',movement_targets:{promotion:0,relegation:1}});
  const first=html.match(/<div class="([^"]*)"[^>]*><span class="league-rank">1<\/span>/)?.[1]||'';
  const third=html.match(/<div class="([^"]*)"[^>]*><span class="league-rank">3<\/span>/)?.[1]||'';
  assert.doesNotMatch(first,/league-relegation-zone/);
  assert.match(third,/league-relegation-zone/);
});

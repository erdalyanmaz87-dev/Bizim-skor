const test=require('node:test');
const assert=require('node:assert/strict');
const leagues=require('./league-system-ui.js');

test('only ranks inside visible promotion cutoff are green even when backend status is stale',()=>{
  const rows=[
    {league_rank:6,player_name:'Altıncı',performance_score:60,valid_round_count:2,promotion_status:'promotion'},
    {league_rank:7,player_name:'Yedinci',performance_score:59,valid_round_count:1,promotion_status:'none'},
    {league_rank:8,player_name:'Sekizinci',performance_score:58,valid_round_count:2,promotion_status:'promotion'}
  ];
  const html=leagues.renderLeagueTable(rows,{league_code:'bronze',movement_targets:{promotion:6,relegation:0}});
  const sixth=html.match(/<div class="([^"]*)"><span class="league-rank">6<\/span>/)?.[1]||'';
  const seventh=html.match(/<div class="([^"]*)"><span class="league-rank">7<\/span>/)?.[1]||'';
  const eighth=html.match(/<div class="([^"]*)"><span class="league-rank">8<\/span>/)?.[1]||'';
  assert.match(sixth,/league-promotion-zone/);
  assert.doesNotMatch(seventh,/league-promotion-zone/);
  assert.doesNotMatch(eighth,/league-promotion-zone/);
});

test('only ranks inside visible relegation cutoff are red even when backend status is stale',()=>{
  const rows=[
    {league_rank:1,player_name:'Bir',performance_score:60,valid_round_count:2,promotion_status:'relegation'},
    {league_rank:2,player_name:'İki',performance_score:59,valid_round_count:2,promotion_status:'none'},
    {league_rank:3,player_name:'Üç',performance_score:58,valid_round_count:2,promotion_status:'none'}
  ];
  const html=leagues.renderLeagueTable(rows,{league_code:'champions',movement_targets:{promotion:0,relegation:1}});
  const first=html.match(/<div class="([^"]*)"><span class="league-rank">1<\/span>/)?.[1]||'';
  const third=html.match(/<div class="([^"]*)"><span class="league-rank">3<\/span>/)?.[1]||'';
  assert.doesNotMatch(first,/league-relegation-zone/);
  assert.match(third,/league-relegation-zone/);
});

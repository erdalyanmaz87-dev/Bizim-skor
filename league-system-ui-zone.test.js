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

test('live Arena leagues show the relegation cutoff when the server has no relegation decisions',()=>{
  const rows=Array.from({length:20},(_,index)=>({
    league_rank:index+1,player_name:`Oyuncu ${index+1}`,valid_round_count:index<14?3:0,promotion_status:'none'
  }));
  const locked_promotion_slots={champions_elite:2,elite_gold:3,gold_silver:4,silver_bronze:6};
  for(const [league_code,firstRank] of Object.entries({champions:19,elite:18,gold:17,silver:15,bronze:0})){
    const html=leagues.renderLeagueShell({league_code,locked_promotion_slots,final_super_round_started:true},rows);
    const zoneRows=[...html.matchAll(/class="([^"]*)" data-arena-zone="relegation" data-arena-relegation-cutoff="true"><span class="league-rank">(\d+)/g)];
    const expected=firstRank?Array.from({length:21-firstRank},(_,index)=>firstRank+index):[];
    assert.deepEqual(zoneRows.map(row=>Number(row[2])),expected,league_code);
    assert.equal(zoneRows.filter(row=>row[1].includes('league-relegation-boundary')).length,firstRank?1:0,league_code);
  }
});

test('Arena refresh preserves the live relegation cutoff after rows have enough turns',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  const classes=new Set(['league-relegation-zone','league-relegation-boundary']);
  const player={dataset:{playerName:'Bir'},querySelector:()=>null};
  const row={dataset:{arenaZone:'relegation',arenaRelegationCutoff:'true'},classList:{
    toggle(name,enabled){enabled?classes.add(name):classes.delete(name)},
    contains:name=>classes.has(name)
  },querySelector:()=>player};
  const context={document:{readyState:'loading',addEventListener(){}}};
  vm.runInNewContext(fs.readFileSync('arena-season1-rules-ui.js','utf8'),context);
  context.BizimSkorArenaSeason1Rules.annotateRows(
    [{player_name:'Bir',league_rank:20,valid_round_count:3,promotion_status:'none'}],
    {querySelectorAll:()=>[row]},2
  );
  assert.equal(row.dataset.arenaZone,'relegation');
  assert.ok(classes.has('league-relegation-zone'));
  assert.ok(classes.has('league-relegation-boundary'));
});

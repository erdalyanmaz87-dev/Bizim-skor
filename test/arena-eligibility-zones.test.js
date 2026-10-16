const test=require('node:test'),assert=require('node:assert/strict'),leagues=require('../league-system-ui'),zones=require('../arena-zone-visibility');
const shener={league_rank:2,player_name:'Şener Çetin',performance_score:65,valid_round_count:1,promotion_status:'none',league_code:'bronze'};
const socrates={league_rank:7,player_name:'Sokrates',performance_score:50.66,valid_round_count:2,promotion_status:'promotion',league_code:'bronze'};
test('one-round entrant remains ranked without green promotion styling and gets an explanation',()=>{
 const html=leagues.renderLeagueTable([shener],{league_code:'bronze',movement_targets:{promotion:6,relegation:0}});
 assert.doesNotMatch(html,/league-row league-promotion-zone/);
 assert.match(html,/Yükselme için 1 tur daha gerekli/);
 assert.match(html,/>65<\/span>/);
});
test('eligible player beyond the absolute rank cutoff retains the earned promotion slot',()=>{
 const html=leagues.renderLeagueTable([socrates],{league_code:'bronze',movement_targets:{promotion:6,relegation:0}});
 assert.match(html,/league-promotion-zone/);
 assert.match(html,/data-arena-zone="promotion"/);
 assert.match(html,/İlk 6 uygun oyuncu yükselir/);
});
test('zone decorator respects movement metadata instead of reapplying raw rank coloring',()=>{
 assert.equal(zones.zoneForRow({dataset:{arenaZone:'none'}},1,31,{promotion:6,relegation:0}),'none');
 assert.equal(zones.zoneForRow({dataset:{arenaZone:'promotion'}},6,31,{promotion:6,relegation:0}),'promotion');
});
test('live season annotation uses eligibility and backend movement instead of absolute rank',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),classes=new Set(['league-promotion-zone']);
 const player={dataset:{playerName:'Şener Çetin'},querySelector:()=>null};
 const row={dataset:{},classList:{toggle(k,on){on?classes.add(k):classes.delete(k)},add:k=>classes.add(k)},querySelector:s=>s==='.league-player'?player:null};
 const context={document:{readyState:'loading',addEventListener(){}}};
 vm.runInNewContext(fs.readFileSync('arena-season1-rules-ui.js','utf8'),context);
 context.BizimSkorArenaSeason1Rules.annotateRows([shener,socrates],{querySelectorAll:()=>[row]},1);
 assert.equal(classes.has('league-promotion-zone'),false);
 assert.equal(row.dataset.arenaZone,'none');
});
test('final Super Lig round makes the season ineligibility explicit without counting Champions League as a tour',()=>{
 const fixtures=[{season:'2026/27',week:5,kickoff:'2026-09-11T17:00:00Z'},{season:'2026/27',week:8,kickoff:'2026-10-16T17:00:00Z'},{season:'2026/27',week:9,kickoff:'2026-10-23T17:00:00Z'}];
 assert.deepEqual(leagues.arenaFinalRound(fixtures,'2026-09-11T17:00:00Z',Date.parse('2026-10-16T20:00:00Z')),{week:8,started:true});
 const html=leagues.renderLeagueShell({league_code:'bronze',is_eligible:false,final_super_round_started:true,last_super_week:8},[shener],{bronze:31});
 assert.match(html,/Bu sezon yükselme hakkı yok · 1\/2 tur/);
 assert.match(html,/Şampiyonlar Ligi.*tur sayısını artırmaz/);
});

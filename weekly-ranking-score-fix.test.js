const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function loadModule(overrides={}){
  const code=fs.readFileSync('weekly-ranking-score-fix.js','utf8');
  const context={
    console,
    document:{readyState:'complete',addEventListener(){},getElementById(){return null}},
    setTimeout(){},
    Map,
    Object,
    Number,
    String,
    Array,
    Math,
    Intl,
    Date
  };
  Object.assign(context,overrides);context.globalThis=context;
  vm.runInNewContext(code,context,{filename:'weekly-ranking-score-fix.js'});
  return context.BizimSkorWeeklyRankingScoreFix;
}

const predictions=[
  {player_name:'Zezu',week:4,fixture_id:1,home_score:1,away_score:0},
  {player_name:'Qwe1s0qwe',week:4,fixture_id:1,home_score:1,away_score:0},
  {player_name:'Mevlüt',week:4,fixture_id:1,home_score:0,away_score:0},
  {player_name:'Ayşegül',week:4,fixture_id:1,home_score:0,away_score:0},
  {player_name:'Kat',week:4,fixture_id:1,home_score:0,away_score:0}
];
const results=[{fixture_id:1,home_score:1,away_score:0}];
const createdAt=new Map([
  ['zezu',2],['qwe1s0qwe',1],['mevlüt',5],['ayşegül',4],['kat',3]
]);
const invites=new Map([
  ['zezu',1],['qwe1s0qwe',0],['mevlüt',5],['ayşegül',0],['kat',0]
]);

test('historical weekly ranking ignores current total invite counts',async()=>{
 const api=loadModule({localStorage:{getItem:()=> 'session'},sb:{rpc:async()=>{throw Error('unnecessary request')}},playerInviteCount:new Map([['erdal',2]]),playerRankingInviteContext:[{week:null,player_name:'Erdal',invite_count:2},{week:3,player_name:'Zezu',invite_count:1},{week:8,player_name:'Erdal',invite_count:2}]});
 assert.equal((await api.seasonInviteCounts(3)).get('erdal')||0,0);
 assert.equal((await api.seasonInviteCounts(8)).get('erdal'),2);
});

test('Hafta Sıralaması Rule 8 ile eşit puanları tek tek sıralar',()=>{
  const api=loadModule();
  const ranked=api.rows(predictions,results,createdAt,invites);
  assert.deepEqual(
    ranked.map(r=>[r.name,r.rank]),
    [['Zezu',1],['Qwe1s0qwe',2],['Mevlüt',3],['Kat',4],['Ayşegül',5]]
  );
});

test('Hafta Sıralaması sırası puan > davet > tam skor > doğru sonuç > kayıt zamanıdır',()=>{
  const api=loadModule();
  const ranked=api.rows([
    {player_name:'A',week:4,fixture_id:1,home_score:1,away_score:0},
    {player_name:'B',week:4,fixture_id:1,home_score:1,away_score:0}
  ],results,new Map([['a',1],['b',2]]),new Map([['a',0],['b',3]]));
  assert.deepEqual(ranked.map(r=>r.name),['B','A']);
  assert.deepEqual(ranked.map(r=>r.rank),[1,2]);
});

test('Hafta Sıralaması oyuncu adını kayıtlı takım logosuyla üretir',()=>{
  const source=fs.readFileSync('weekly-ranking-score-fix.js','utf8');
  assert.match(source,/BizimSkorPlayerIdentity\?\.nameOnly\?\.\(name\)/);
  assert.match(source,/await root\.BizimSkorPlayerIdentity\?\.loadContext\?\.\(\)/);
  assert.doesNotMatch(source,/>\$\{esc\(r\.name\)\}<\/button>/);
});

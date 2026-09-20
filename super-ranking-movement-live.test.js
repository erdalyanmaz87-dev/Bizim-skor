const test=require('node:test');
const assert=require('node:assert/strict');
const Live=require('./super-ranking-movement-live');

test('genel siralamada onceki ve mevcut siradan hareket yonunu hesaplar',()=>{
  assert.deepEqual(Live.movement(25,21),{direction:'up'});
  assert.deepEqual(Live.movement(21,22),{direction:'down'});
  assert.equal(Live.movement(10,10),null);
});

test('haftalik hareket sadece sonucun ait oldugu hafta icin uygulanir',()=>{
  assert.deepEqual(Live.movementForContext({scope:'weekly',resultWeek:5,selectedWeek:5,beforeRank:26,currentRank:19}),{direction:'up'});
  assert.equal(Live.movementForContext({scope:'weekly',resultWeek:5,selectedWeek:4,beforeRank:26,currentRank:19}),null);
});

test('rpcnin scope kolonunu kapsam olarak indeksler',()=>{
  const idx=Live.indexRows([
    {context_id:'general:all',scope:'general',week:5,player_name:'Kat',before_rank:25},
    {context_id:'weekly:5',scope:'weekly',week:5,player_name:'Kat',before_rank:26}
  ]);
  assert.equal(idx.general.get('kat').beforeRank,25);
  assert.equal(idx.weekly.get('kat').beforeRank,26);
  assert.equal(idx.resultWeek,5);
});

test('hafta secici ekranda yoksa basliktan haftayi bulur',()=>{
  const doc={getElementById(id){
    if(id==='weeklyRankingWeekSelect')return null;
    if(id==='weeklyRankingTitle')return{textContent:'🏆 5. Hafta Sıralaması'};
    return null;
  }};
  assert.equal(Live.selectedWeek(doc),5);
});

test('hareket rozeti sadece yon okunu gosterir',()=>{
  let html='';
  const node={classList:{add(){}},querySelector(){return null},insertAdjacentHTML(_where,value){html=value}};
  Live.reconcile(node,{direction:'up'},null);
  assert.match(html,/>▲<\/span>/);
  assert.doesNotMatch(html,/▲\s+\d/);
});

test('hareket stillerini ana yardimci yuklenmese bile kendi basina garanti eder',()=>{
  const nodes=new Map();
  const doc={
    getElementById(id){return nodes.get(id)||null},
    createElement(tag){return{tag,id:'',textContent:''}},
    head:{appendChild(node){nodes.set(node.id,node)}}
  };
  assert.equal(typeof Live.ensureMovementStyles,'function');
  assert.equal(Live.ensureMovementStyles(doc),true);
  const css=nodes.get('bizimSkorRankingMovementLiveStyle')?.textContent||'';
  assert.match(css,/\.bs-rank-move\{[^}]*display:flex/i);
  assert.match(css,/white-space:nowrap/i);
  assert.match(css,/\.bs-rank-up\{[^}]*#16a34a/i);
  assert.match(css,/\.bs-rank-down\{[^}]*#dc2626/i);
  assert.match(css,/html\[data-theme="dark"\] \.bs-rank-up\{[^}]*#4ade80/i);
  assert.match(css,/html\[data-theme="dark"\] \.bs-rank-down\{[^}]*#f87171/i);
  assert.equal(Live.ensureMovementStyles(doc),false);
});

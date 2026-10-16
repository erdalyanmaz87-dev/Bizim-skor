const test=require('node:test'),assert=require('node:assert/strict');
const opportunity=require('../opportunity-match-utils');
const cards=require('../prediction-week-cards');
const nav=require('../simple-navigation');

test('opportunity menu follows active status rounds, including newly added weeks',()=>{
  const rows=[{competition:'champions_league',week:2,fixture_id:33},{competition:'champions_league',week:3,fixture_id:42},{competition:'super_lig',week:8,fixture_id:118},{competition:'super_lig',week:9,fixture_id:127}];
  assert.deepEqual(opportunity.selectMenuMatches(rows,[{competition:'champions_league',week:3},{competition:'super_lig',week:8}]).map(x=>x.fixture_id),[42,118]);
  assert.deepEqual(opportunity.selectMenuMatches(rows,[{competition:'super_lig',week:9}]).map(x=>x.fixture_id),[127]);
  assert.deepEqual(opportunity.selectMenuMatches(rows,[]),[]);
});

test('active rounds use the same archive rule as Tahmin Durumu',()=>{
  const make=(competition,week,label,theme)=>({dataset:{competition,week:String(week)},classList:{contains:x=>x===theme},querySelector:selector=>selector==='strong'?{textContent:label}:{dataset:{countdownDeadline:'2026-10-13T16:45:00Z'}}});
  const source=[make('champions_league',2,'Şampiyonlar Ligi 2. Hafta','theme-champions'),make('champions_league',3,'Şampiyonlar Ligi 3. Hafta','theme-champions'),make('super_lig',8,'Süper Lig 8. Hafta','theme-super')];
  const doc={querySelectorAll:()=>source};
  assert.deepEqual(cards.activeRounds(doc,nav.isArchivedStatusCard,Date.parse('2026-10-16T18:00:00Z')),[{competition:'champions_league',week:3},{competition:'super_lig',week:8}]);
});

test('status cards carry structured competition and week identities',()=>{
  const html=cards.render(cards.buildCards([{week:8}],[{week:3}],[{week:5}]));
  assert.match(html,/data-competition="super_lig" data-week="8"/);
  assert.match(html,/data-competition="champions_league" data-week="3"/);
  assert.match(html,/data-competition="nations_league" data-week="5"/);
});

test('open opportunity menu removes archived rounds and follows status-card changes',async()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  let observer,rounds=[{competition:'champions_league',week:2},{competition:'champions_league',week:3}],requests=0;
  const box={innerHTML:''},layer={style:{}},doc={
    getElementById:id=>id==='oppMenuCards'?box:id==='oppMenuLayer'?layer:id==='oppStyles'?{}:null,
    querySelectorAll:()=>[],addEventListener(){},documentElement:{}
  };
  const context={document:doc,console,Date,setTimeout(){},addEventListener(){},MutationObserver:class{constructor(fn){observer=fn}observe(){}},
    BizimSkorOpportunity:opportunity,BizimSkorPredictionWeekCards:{activeRounds:()=>rounds},
    sb:{async rpc(){requests++;return{data:[{competition:'champions_league',week:2,fixture_id:33,home_team:'City',away_team:'PSG'},{competition:'champions_league',week:3,fixture_id:42,home_team:'PSG',away_team:'Barcelona'}]}}}};
  context.window=context;
  vm.runInNewContext(fs.readFileSync('opportunity-match-ui.js','utf8'),context);
  await context.BizimSkorOpportunityUI.refresh();
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(box.innerHTML,/City/);
  rounds=[{competition:'champions_league',week:3}];observer();
  await new Promise(resolve=>setImmediate(resolve));
  assert.doesNotMatch(box.innerHTML,/City/);
  assert.match(box.innerHTML,/Barcelona/);
  const stableRequests=requests;observer();observer();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests,stableRequests,'DOM updates must not generate repeated network calls');
  rounds=[];observer();
  await new Promise(resolve=>setImmediate(resolve));
  assert.doesNotMatch(box.innerHTML,/Barcelona/);
});

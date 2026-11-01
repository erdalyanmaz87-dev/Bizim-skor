const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function load(root={}){const box={...root,module:{exports:{}},console};vm.runInNewContext(fs.readFileSync('daily-ranking-link.js','utf8'),box);return box.module.exports;}
test('daily heading offers live standings and no link for an empty day',()=>{
 const api=load();
 assert.match(api.heading({label:'Günün Maçları',matches:[{competition:'super_lig',id:99}]},String),/Canlı Puan Durumu/);
 assert.doesNotMatch(api.heading({label:'Günün Maçları',matches:[]},String),/Canlı Puan Durumu/);
});
test('same-day competitions have separate targets with fixture identities',()=>{
 const api=load();const targets=api.targets([{competition:'super_lig',id:10},{competition:'super_lig',id:11},{competition:'champions_league',id:10}]);
 assert.equal(targets.length,2);assert.equal(targets[1].competition,'champions_league');assert.equal(targets[1].id,10);
});
test('fixture lookup opens its actual week rather than the currently selected week',async()=>{
 let table,fixture,opened,selected,league,week;
 const api=load({sb:{from:t=>(table=t,{select:()=>({eq:(key,id)=>(fixture=id,{single:async()=>({data:{week:10,season:'2026/27'}})})})})},
 document:{getElementById:()=>({set value(v){selected=v}})},
 BizimSkorScreenNavigationRuntime:{open:id=>(opened=id,true)},
 BizimSkorWeeklyRankingStrip:{setup:async()=>{},setCompetition:(v)=>{league=v}},loadWeeklyRanking:async w=>{week=w}});
 await api.open({competition:'super_lig',id:99});
 assert.equal(table,'fixtures');assert.equal(fixture,99);assert.equal(opened,'weeklyRankings');assert.equal(selected,'10');assert.equal(league,'super_lig');assert.equal(week,10);
});
test('international standings resolve the fixture through session-protected week APIs',async()=>{
 const calls=[];const api=load({localStorage:{getItem:()=> 'test-session'},sb:{rpc:async(name,args)=>{calls.push({name,args});return{data:name.endsWith('available_weeks')?[{week:2},{week:3}]:args.p_week===2?[{fixture_id:99}]:[]}}}});
 const context=await api.fixtureContext({competition:'champions_league',id:99});
 assert.equal(context.week,2);assert.ok(calls.every(c=>c.args.p_token==='test-session'));assert.equal(calls[0].name,'get_champions_league_available_weeks');
});

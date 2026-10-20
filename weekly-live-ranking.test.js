const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'weekly-live-ranking.js'),'utf8');
function api(root={}){const context={...root,module:{exports:{}},console};vm.runInNewContext(source,context);return context.module.exports;}
const data={live:true,has_new_scoring:true,players:[{player_name:'A"<B>',league_rank:1,points:16,exact_count:1,difference_hits:1,total_hits:0,result_hits:0}]};
function fixture(){
 let table={},html='',writes=0,calls=0;
 const root={document:{visibilityState:'visible'},localStorage:{getItem:()=>null},sb:{rpc:async()=>{calls++;return {data};}}};
 const board={id:'weeklyRankingBoard',dataset:{scoringContext:'{"competition":"super_lig","week":9}'},getClientRects:()=>[1],querySelector:selector=>selector==='table'?table:null,scrollTop:42,closest:()=>null};
 Object.defineProperty(board,'innerHTML',{get:()=>html,set:x=>{html=x;table={};writes++;}});
 return {root,board,api:api(root),stats:()=>({calls,writes,html}),replaceTable:()=>table={}};
}
test('one live label, removed on FT, escaped players and only weekly scope',()=>{
 const a=api(),c={competition:'champions_league',week:3};
 assert.equal((a.markup(data,c).match(/🔴 Canlı/g)||[]).length,1);
 assert.ok(!a.markup({...data,live:false},c).includes('🔴 Canlı'));
 assert.ok(a.markup(data,c).includes('A&quot;&lt;B&gt;'));
 assert.equal(a.context({id:'generalBoard',dataset:{scoringContext:'{"competition":"super_lig","week":9}'}}),null);
});
test('refresh throttles observers, retains scroll and avoids replacing unchanged tables',async()=>{
 const f=fixture();await f.api.refreshBoard(f.board);await f.api.refreshBoard(f.board);
 assert.equal(f.stats().calls,1);assert.equal(f.stats().writes,1);
 await f.api.refreshBoard(f.board,true);
 assert.equal(f.stats().calls,2);assert.equal(f.stats().writes,1);assert.equal(f.board.scrollTop,42);
 f.root.sb.rpc=async()=>({data:{...data,live:false}});await f.api.refreshBoard(f.board,true);
 assert.ok(!f.stats().html.includes('🔴 Canlı'));
});
test('hidden tabs and hidden boards do not poll',async()=>{
 let f=fixture();f.root.document.visibilityState='hidden';await f.api.refreshBoard(f.board,true);assert.equal(f.stats().calls,0);
 f=fixture();f.board.getClientRects=()=>[];await f.api.refreshBoard(f.board,true);assert.equal(f.stats().calls,0);
});
test('week changes and newer table renders reject old responses',async()=>{
 let f=fixture(),resolve;f.root.sb.rpc=()=>new Promise(r=>resolve=r);
 let pending=f.api.refreshBoard(f.board);await f.api.refreshBoard(f.board,true);
 f.board.dataset.scoringContext='{"competition":"super_lig","week":10}';resolve({data});await pending;assert.equal(f.stats().writes,0);
 f=fixture();f.root.sb.rpc=()=>new Promise(r=>resolve=r);pending=f.api.refreshBoard(f.board);f.replaceTable();resolve({data});await pending;assert.equal(f.stats().writes,0);
});

test('current week switches at kickoff, before any result is entered',()=>{
 const context={module:{exports:{}},console};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'weekly-ranking-strip.js'),'utf8'),context);
 const f=context.module.exports.latestStartedWeek,fixtures=[{week:2,kickoff:'2026-10-01T00:00:00Z'},{week:3,kickoff:'2026-10-20T16:45:00Z'},{week:4,kickoff:'2026-11-03T00:00:00Z'}];
 assert.equal(f(fixtures,Date.parse('2026-10-20T16:44:59Z')),2);
 assert.equal(f(fixtures,Date.parse('2026-10-20T16:45:00Z')),3);
 assert.equal(f(fixtures,Date.parse('2026-10-20T16:45:01Z')),3);
});

test('Champions weekly loader paints live points on its first render',async()=>{
 const context={module:{exports:{}},console,localStorage:{getItem:()=> 'test-session'}};
 const liveContext={module:{exports:{}},console};vm.runInNewContext(source,liveContext);context.BizimSkorWeeklyLiveRanking={markup:liveContext.module.exports.markup,acceptSnapshot(){}};
 const board={dataset:{},innerHTML:''},title={};
 context.document={getElementById:id=>id==='championsWeeklyRankingBoard'?board:id==='weeklyRankingTitle'?title:null};
 context.sb={rpc:async name=>name==='get_live_weekly_ranking'?{data}:{data:[]}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'weekly-ranking-strip.js'),'utf8'),context);
 await context.module.exports.loadChampionsWeeklyRanking(3);
 assert.ok(board.innerHTML.includes('Canlı'));assert.ok(board.innerHTML.includes('<b>16</b>'));
});

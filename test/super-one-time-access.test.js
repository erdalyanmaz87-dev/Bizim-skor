const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
function setup(allowed=true){
 const values={bizimSkorName:'Özcan',bizimSkorFriendToken:'test-session'};
 const start=html.indexOf('let superLeagueOneTimeUnlock=null;');
 const refresh=html.slice(start,html.indexOf('async function loadPredictionWeeks',start));
 const lockStart=html.indexOf('function weekLocked()',start);
 const lock=html.slice(lockStart,html.indexOf('\n',lockStart));
 const calls=[];
 const ctx=vm.createContext({localStorage:{getItem:k=>values[k]},sb:{rpc:async(name,args)=>{calls.push({name,args});return {data:allowed}}},selectedPredictionWeek:11,allFixtures:[],BizimSkorTwoWeek:{isWeekLocked:()=>true},Date});
 vm.runInContext(refresh+lock,ctx);
 return {ctx,calls,values};
}
test('server-authorized Ozcan week 11 opens the locked prediction screen',async()=>{const s=setup();assert.equal(await s.ctx.refreshSuperLeagueOneTimeUnlock(11),true);assert.equal(s.ctx.weekLocked(),false);assert.equal(s.calls[0].args.p_week,11)});
test('server refusal keeps the screen locked',async()=>{const s=setup(false);assert.equal(await s.ctx.refreshSuperLeagueOneTimeUnlock(11),false);assert.equal(s.ctx.weekLocked(),true)});
test('another week or session cannot inherit the grant',async()=>{const s=setup();await s.ctx.refreshSuperLeagueOneTimeUnlock(11);s.ctx.selectedPredictionWeek=10;assert.equal(s.ctx.weekLocked(),true);s.ctx.selectedPredictionWeek=11;s.values.bizimSkorFriendToken='another-session';assert.equal(s.ctx.weekLocked(),true)});

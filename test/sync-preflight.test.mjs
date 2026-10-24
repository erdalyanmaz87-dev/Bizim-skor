import test from 'node:test';
import assert from 'node:assert/strict';
import {syncSoccersApi} from '../supabase/functions/live-score-sync/soccersapi-sync.ts';
const now=new Date('2026-10-24T12:00:00Z');
const fixture={id:122,competition:'super_lig',home_team:'Samsunspor',away_team:'Amed SK',kickoff:'2026-10-24T16:00:00Z'};
function setup({active=false,links=[],log=[],rows=[],f=fixture}={}){
 const calls=[],writes=[];
 const sb={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='get_soccersapi_poll_gate'?[{active_fixture_count:active?1:0,request_count:10,remaining_window_minutes:240}]:name==='reserve_soccersapi_request'?true:name==='record_provider_observation'?[{should_finalize:false}]:null,error:null}},from(table){
  let eqs=[],kind='select',value;
  const q={select(){return q},gte(){return q},lte(){return q},in(){return q},eq(k,v){eqs.push([k,v]);return q},maybeSingle(){return q},update(v){kind='update';value=v;return q},upsert(v){kind='upsert';value=v;return q},then(resolve,reject){let data=table==='fixtures'?[f]:table==='live_fixture_links'?links:table==='live_score_discovery_log'?log:[];if(eqs.length)data=data.filter(x=>eqs.every(([k,v])=>x[k]===v));if(table==='live_fixture_links'&&eqs.length)data=data[0]||null;if(kind!=='select'){writes.push({table,kind,value});data=null}return Promise.resolve({data,error:null}).then(resolve,reject)}};return q;
 }};
 return {sb,calls,writes,fetch:async()=>({ok:true,json:async()=>({data:rows,meta:{pages:1,requests_left:80}})})};
}
const raw={id:123,league:{id:3515},time:{timestamp:Date.parse(fixture.kickoff)/1000},teams:{home:{name:'Samsunspor'},away:{name:'Amed SK'}},status:0};
test('links a scheduled match before kickoff without starting it or consuming repeated requests',async()=>{
 const s=setup({rows:[raw]});globalThis.fetch=s.fetch;
 const r=await syncSoccersApi(s.sb,'test',{}, {autoFinalize:true,now});
 assert.equal(r.linked,1);assert.equal(r.updated,0);assert.equal(r.preflight,true);
 assert.ok(s.writes.some(w=>w.table==='live_fixture_links'&&w.value.provider_fixture_id===123));
 assert.ok(!s.calls.some(c=>c.name==='record_provider_observation'));
 const second=setup({log:[{competition:'super_lig',fixture_id:122,attempted_at:now.toISOString()}]});globalThis.fetch=()=>{throw Error('must not request')};
 assert.equal((await syncSoccersApi(second.sb,'test',{}, {autoFinalize:true,now})).polled,false);
});
test('missing matches become explicit retryable diagnostics',async()=>{
 const s=setup();globalThis.fetch=s.fetch;
 const r=await syncSoccersApi(s.sb,'test',{}, {autoFinalize:true,now});
 assert.equal(r.unmatched[0].fixture_id,122);
 assert.ok(s.calls.some(c=>c.name==='record_live_score_discovery'&&c.args.p_status==='not_matched'));
 assert.equal(s.writes.filter(w=>w.table==='live_fixture_links').length,0);
});
test('manual overrides are never silently re-enabled',async()=>{
 const s=setup({links:[{competition:'super_lig',fixture_id:122,enabled:false}],rows:[raw]});
 globalThis.fetch=()=>{throw Error('must not request')};
 const r=await syncSoccersApi(s.sb,'test',{}, {autoFinalize:true,now});assert.equal(r.polled,false);assert.equal(s.writes.length,0);
});
test('ongoing matched fixtures still update from the provider',async()=>{
 const f={...fixture,kickoff:'2026-10-24T11:50:00Z'},s=setup({active:true,f,rows:[{...raw,time:{timestamp:Date.parse(f.kickoff)/1000},status:1,status_period:'1st Half',scores:{home_score:0,away_score:0}}]});globalThis.fetch=s.fetch;
 const r=await syncSoccersApi(s.sb,'test',{}, {autoFinalize:true,now});assert.equal(r.updated,1);assert.ok(s.calls.some(c=>c.name==='record_provider_observation'));
});

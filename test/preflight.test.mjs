import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../supabase/functions/live-score-sync/soccersapi.mjs';
const now=new Date('2026-10-24T12:00:00Z');
const fixture={competition:'super_lig',id:122,kickoff:'2026-10-24T16:00:00Z'};
test('covers all of tomorrow in Istanbul, including matches more than 24 hours away',()=>{
 const early=new Date('2026-10-24T06:00:00Z');
 assert.equal(api.needsPreflight({...fixture,kickoff:'2026-10-25T20:59:59Z'},null,null,early),true);
 assert.equal(api.needsPreflight({...fixture,kickoff:'2026-10-25T21:00:00Z'},null,null,early),false);
 assert.equal(api.nextMatchdayEnd(new Date('2026-10-24T21:05:00Z')).toISOString(),'2026-10-26T20:59:59.999Z');
});
test('matches the actual Amed provider name without accepting unrelated clubs or duplicate matches',()=>{
 const f={...fixture,home_team:'Samsunspor',away_team:'Amed SK'};
 const raw={id:2628178,league:{id:3515},time:{timestamp:1792868400,timezone:'UTC+3'},teams:{home:{name:'Samsunspor'},away:{name:'Amed Sportif Faaliyetler'}}};
 assert.equal(api.matchSoccersFixtures([f],[raw]).length,1);
 assert.equal(api.matchSoccersFixtures([f],[{...raw,teams:{...raw.teams,away:{name:'Adanaspor'}}}]).length,0);
 assert.equal(api.matchSoccersFixtures([f],[raw,{...raw,id:100}]).length,0);
});
test('preflight checks before kickoff, retries missing mappings, and avoids repeated provider spend',()=>{
 assert.equal(api.needsPreflight(fixture,null,null,now),true);
 assert.equal(api.needsPreflight(fixture,{attempted_at:'2026-10-24T11:50:00Z'},null,now),false);
 assert.equal(api.needsPreflight(fixture,{attempted_at:'2026-10-24T10:00:00Z'},null,now),true);
 assert.equal(api.needsPreflight(fixture,null,{enabled:true,provider_fixture_id:123},now),false);
 assert.equal(api.needsPreflight(fixture,null,{enabled:false},now),false);
 assert.equal(api.needsPreflight({...fixture,kickoff:'2026-10-26T16:00:00Z'},null,null,now),false);
 assert.equal(api.needsPreflight({...fixture,kickoff:'2026-10-24T11:00:00Z'},null,null,now),false);
});
test('preflight retries once near kickoff even when an earlier check was recent',()=>{
 const near={...fixture,kickoff:'2026-10-24T12:10:00Z'};
 assert.equal(api.needsPreflight(near,{attempted_at:'2026-10-24T11:40:00Z'},null,now),true);
 assert.equal(api.needsPreflight(near,{attempted_at:'2026-10-24T11:55:00Z'},null,now),false);
});
test('a preflight-verified provider identity survives display name changes but not a different kickoff',()=>{
 const f={...fixture,home_team:'Samsunspor',away_team:'Amed SK'};
 const raw={id:2628178,league:{id:3515},time:{timestamp:1792868400,timezone:'UTC+3'},teams:{home:{name:'New sponsor'},away:{name:'New display name'}}};
 const link={competition:'super_lig',fixture_id:122,provider:'soccersapi',provider_fixture_id:2628178,enabled:true};
 assert.equal(api.matchSoccersFixtures([f],[raw],[link]).length,1);
 assert.equal(api.matchSoccersFixtures([f],[raw],[{...link,enabled:false}]).length,0);
 assert.equal(api.matchSoccersFixtures([f],[{...raw,time:{timestamp:1792868400+86400,timezone:'UTC+3'}}],[link]).length,0);
});

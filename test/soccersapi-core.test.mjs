import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../supabase/functions/live-score-sync/soccersapi.mjs';

test('normalizes actual provider states and refuses missing scores',()=>{
 const raw={id:2678792,status:1,status_period:'2nd Half',time:{minute:'63'},scores:{home_score:'2',away_score:'1'}};
 assert.equal(typeof api.normalizeSoccersFixture,'function');
 assert.deepEqual(api.normalizeSoccersFixture(raw),{provider_fixture_id:2678792,status:'2H',elapsed:63,home_score:2,away_score:1});
 assert.equal(api.normalizeSoccersFixture({...raw,status:11}).status,'HT');
 assert.equal(api.normalizeSoccersFixture({...raw,status:3}).status,'FT');
 for(const status of [0,2,6,7,8,9,18,31,32,99]) assert.equal(api.normalizeSoccersFixture({...raw,status}),null);
 assert.equal(api.normalizeSoccersFixture({...raw,scores:{home_score:null,away_score:null}}),null);
});
test('matches short club names through explicit aliases',()=>{
 for(const [home,away,providerHome,providerAway] of [['Roma','Slovan Bratislava','AS Roma','SK Slovan Bratislava'],['Porto','PSV','FC Porto','PSV Eindhoven']]){
  const f={id:1,competition:'champions_league',home_team:home,away_team:away,kickoff:'2026-10-20T19:00:00Z'};
  const r={id:2,league:{id:539},time:{timestamp:1792533600,timezone:'UTC+3'},teams:{home:{name:providerHome},away:{name:providerAway}}};
  assert.equal(api.matchSoccersFixtures([f],[r]).length,1);
 }
});
test('matches both names, league and exact kickoff without ambiguous guesses',()=>{
 assert.equal(typeof api.matchSoccersFixtures,'function');
 const internal=[{competition:'champions_league',id:38,home_team:'Fenerbahçe',away_team:'Slavia Prag',kickoff:'2026-10-20T16:45:00Z'}];
 const raw={id:2678792,league:{id:539},time:{timestamp:1792514700},teams:{home:{name:'Fenerbahce Istanbul'},away:{name:'SK Slavia Prague'}}};
 assert.equal(api.matchSoccersFixtures(internal,[raw]).length,1);
 assert.equal(api.matchSoccersFixtures(internal,[{...raw,time:{timestamp:1792525500,timezone:'UTC+3'}}]).length,1);
 assert.equal(api.matchSoccersFixtures(internal,[{...raw,league:{id:3515}}]).length,0);
 assert.equal(api.matchSoccersFixtures(internal,[raw,{...raw,id:99}]).length,0);
 assert.equal(api.matchSoccersFixtures(internal,[{...raw,time:{timestamp:1792518300}}]).length,0);
});

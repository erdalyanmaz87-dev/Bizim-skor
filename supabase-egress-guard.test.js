const assert=require('assert');
const guard=require('./supabase-egress-guard.js');
(async()=>{
  let now=1000,calls=0;
  const client={rpc(name,args){calls++;return Promise.resolve({data:[args?.p_week||0],error:null})}};
  guard.install(client,()=>now);
  const args={p_token:'t',p_competition:'super_lig',p_season:'2026/27',p_week:6};
  await client.rpc('get_robot_applied_fixture_ids',args);
  await client.rpc('get_robot_applied_fixture_ids',args);
  assert.strictEqual(calls,1,'same robot RPC should be cached inside TTL');
  now+=guard.CACHE_MS+1;
  await client.rpc('get_robot_applied_fixture_ids',args);
  assert.strictEqual(calls,2,'robot RPC should refresh after TTL');
  await client.rpc('list_player_ranking_directory',{p_token:'t'});
  await client.rpc('list_player_ranking_directory',{p_token:'t'});
  assert.strictEqual(calls,4,'other RPC calls must not be cached');

  let failCalls=0;
  const failing={rpc(){failCalls++;return Promise.resolve({data:null,error:{message:'x'}})}};
  guard.install(failing,()=>now);
  await failing.rpc('get_robot_applied_fixture_ids',args);
  await failing.rpc('get_robot_applied_fixture_ids',args);
  assert.strictEqual(failCalls,2,'failed robot RPC must remain retryable');
  console.log('supabase-egress-guard ok');
})().catch(e=>{console.error(e);process.exit(1)});

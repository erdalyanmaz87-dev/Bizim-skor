import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);

test('anonymous push is denied before payload parsing or delivery',async()=>{
 const {authorizePushRequest}=await import('../supabase/functions/send-push/authorization.mjs');
 let checks=0;
 const deps={serviceKey:'private-service-key',authorizeCron:async()=>{checks++;return false}};
 for(const headers of [{},{apikey:'sb_publishable_public'},{authorization:'Bearer sb_publishable_public'},{authorization:'Bearer normal-player-jwt'}]){
  assert.equal(await authorizePushRequest(new Request('https://test.invalid',{method:'POST',headers}),deps),false);
 }
 assert.equal(checks,0);
 assert.equal(await authorizePushRequest(new Request('https://test.invalid',{method:'POST',headers:{authorization:'Bearer private-service-key'}}),deps),true);
 assert.equal(await authorizePushRequest(new Request('https://test.invalid',{method:'GET',headers:{authorization:'Bearer private-service-key'}}),deps),false);
 assert.equal(await authorizePushRequest(new Request('https://test.invalid',{method:'POST',headers:{'x-cron-secret':'wrong'}}),deps),false);
 assert.equal(await authorizePushRequest(new Request('https://test.invalid',{method:'POST',headers:{'x-cron-secret':'cron-secret'}}),{...deps,authorizeCron:async()=>true}),true);
 assert.equal(await authorizePushRequest(new Request('https://test.invalid',{method:'POST',headers:{'x-cron-secret':'cron-secret'}}),{...deps,authorizeCron:async()=>{throw Error('offline')}}),false);
});

test('legacy login never offers to claim a pre-existing account or reset by device',()=>{
 const html=fs.readFileSync(new URL('index.html',root),'utf8');
 const login=html.slice(html.indexOf('const loginAction='),html.indexOf('const registerAction='));
 assert.doesNotMatch(login,/claim_or_set_player_pin|find_player_login_state/);
 assert.doesNotMatch(html,/rpc\('reset_player_pin_from_registered_device'/);
 assert.match(html,/if\(!q\.data\).*PIN/s);
});

test('signup has the same public response for existing and new emails',async()=>{
 const {handleAction}=await import('../supabase/functions/mobile-account-auth/core.mjs');
 const input={action:'signup',email:'person@example.com',name:'Player',password:'password123'};
 const deps={gate:async()=>true,signup:async()=>({})};
 const fresh=await handleAction(input,deps);
 const existing=await handleAction(input,{...deps,signup:async()=>({error:true,alreadyExists:true})});
 assert.deepEqual(existing,fresh);
});

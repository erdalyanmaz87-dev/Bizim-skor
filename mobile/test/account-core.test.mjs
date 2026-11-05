import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {create,validatePassword,normalizeName}=createRequire(import.meta.url)('../account-core.js');
function setup(overrides={}){
 const saved=new Map([['bizimSkorName','Kahve'],['bizimSkorFriendToken','old-token']]);
 const calls=[];const user={id:'verified-user',email:'test@example.invalid',email_confirmed_at:'2026-10-27T00:00:00Z'};
 const session={access_token:'access',refresh_token:'refresh',user};
 const client={auth:{getSession:async()=>({data:{session},error:null}),setSession:async()=>({error:null}),verifyOtp:async()=>({data:{session},error:null}),updateUser:async()=>({error:null}),signOut:async()=>({error:null})},rpc:async(name,args)=>{calls.push({name,args});return {data:name==='mobile_account_status'?{linked:true,player_id:543,player_name:'Kahve'}:name==='mobile_issue_player_session'?{player_id:543,player_name:'Kahve',token:'bridge-token'}:{player_id:543,player_name:'Kahve'},error:null}}};
 Object.assign(client,overrides);let shown=null;const controller=create({client,gateway:async()=>({session}),storage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},deviceId:()=> 'device',onPlayer:data=>{shown=data}});return {controller,client,calls,saved,get shown(){return shown}};
}
test('strong passwords and Unicode player names validate before any request',()=>{assert.throws(()=>validatePassword('1234'));assert.throws(()=>validatePassword('a'.repeat(257)));assert.equal(validatePassword('correct horse'),'correct horse');assert.equal(normalizeName('  Çay   Kahve '),'Çay Kahve');assert.throws(()=>normalizeName('mail@example.com'));});
test('verified email restore issues legacy-compatible session without creating player',async()=>{const s=setup();const result=await s.controller.restore();assert.equal(result.signedIn,true);assert.equal(s.shown.player_id,543);assert.equal(s.saved.get('bizimSkorFriendToken'),'bridge-token');assert.deepEqual(s.calls.map(c=>c.name),['mobile_account_status','mobile_issue_player_session']);});
test('existing account linking passes ownership proof and retains stable player id',async()=>{const s=setup();const result=await s.controller.link('Kahve','1234');assert.equal(result.player_id,543);assert.deepEqual(s.calls[0],{name:'mobile_link_player',args:{p_name:'Kahve',p_pin:'1234',p_legacy_token:'old-token',p_device_id:'device'}});assert.equal(s.calls.some(c=>c.name==='mobile_create_player'),false);});
test('linking uses current legacy session after a PIN login in the same launch',async()=>{const s=setup();s.saved.set('bizimSkorName','Çay');s.saved.set('bizimSkorFriendToken','fresh-token');assert.equal(s.controller.legacy.name,'Çay');await s.controller.link('Çay','');assert.equal(s.calls[0].args.p_legacy_token,'fresh-token');});
test('failed ownership proof does not overwrite current game session or create player',async()=>{const s=setup({rpc:async()=>({data:{error:'invalid_player_credentials'}})});await assert.rejects(s.controller.link('Kahve','0000'),/PIN/);assert.equal(s.saved.get('bizimSkorFriendToken'),'old-token');assert.equal(s.saved.get('bizimSkorName'),'Kahve');});
test('no email session preserves old technical-test login for gradual migration',async()=>{const s=setup();s.client.auth.getSession=async()=>({data:{session:null}});assert.deepEqual(await s.controller.restore(),{signedIn:false});assert.equal(s.saved.get('bizimSkorName'),'Kahve');assert.equal(s.calls.length,0);});
test('unconfirmed email cannot mint a game session',async()=>{const s=setup();s.client.auth.getSession=async()=>({data:{session:{user:{email_confirmed_at:null}}}});assert.deepEqual(await s.controller.restore(),{signedIn:false});assert.equal(s.calls.length,0);});
test('password reset requires verified recovery flow and consumes proof',async()=>{const s=setup();await assert.rejects(s.controller.resetPassword('strong enough'),/Önce/);await s.controller.verify('test@example.invalid','123456','recovery');await s.controller.resetPassword('strong enough');await assert.rejects(s.controller.resetPassword('strong enough'),/Önce/);});
test('deletion requests only call queue; logout clears game credentials',async()=>{const s=setup();await s.controller.requestDeletion('please delete');assert.equal(s.calls[0].name,'mobile_request_account_deletion');assert.equal(s.saved.get('bizimSkorName'),'Kahve');await s.controller.logout();assert.equal(s.saved.size,0);});
test('legacy test player can request deletion without email migration',async()=>{const s=setup();await s.controller.legacyDeletion();assert.equal(s.calls[0].name,'create_support_request');assert.equal(s.calls[0].args.p_token,'old-token');assert.match(s.calls[0].args.p_message,/HESAP SİLME TALEBİ/);assert.equal(s.saved.get('bizimSkorName'),'Kahve');});
test('legacy device-only PIN recovery is rejected without a request',async()=>{const s=setup();await assert.rejects(s.controller.legacyResetPin('Kahve','1234'),/e-posta/);assert.equal(s.calls.length,0);assert.equal(s.saved.get('bizimSkorFriendToken'),'old-token');});
test('PIN renewal requires email recovery proof and preserves identity on server rejection',async()=>{const s=setup();await assert.rejects(s.controller.resetPin('1357'),/Önce/);await s.controller.verify('test@example.invalid','123456','recovery');s.client.rpc=async()=>({data:false});await assert.rejects(s.controller.resetPin('1357'),/tamamlanamadı/);assert.equal(s.saved.get('bizimSkorFriendToken'),'old-token');s.client.rpc=async(name,args)=>{s.calls.push({name,args});return {data:true}};await s.controller.resetPin('1357');assert.deepEqual(s.calls.at(-1),{name:'reset_player_pin_with_email',args:{p_new_pin:'1357'}});assert.equal(s.saved.has('bizimSkorFriendToken'),false);await assert.rejects(s.controller.resetPin('2468'),/Önce/);});

test('same-password recovery consumes verified proof and restores the existing player',async()=>{
 const s=setup();s.client.auth.updateUser=async()=>({error:{code:'same_password'}});
 await assert.rejects(s.controller.resetPassword('secret123'),/Önce/);
 await s.controller.verify('test@example.invalid','verified','recovery');
 const state=await s.controller.resetPassword('secret123');assert.equal(state.passwordUnchanged,true);assert.equal(s.shown.player_id,543);
 await assert.rejects(s.controller.resetPassword('secret123'),/Önce/);
});
test('other native password update errors fail closed',async()=>{
 const s=setup();s.client.auth.updateUser=async()=>({error:{code:'weak_password'}});
 await s.controller.verify('test@example.invalid','verified','recovery');
 await assert.rejects(s.controller.resetPassword('secret123'),/ulaşılamıyor/);
});

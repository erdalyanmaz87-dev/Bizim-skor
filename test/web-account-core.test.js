const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create,validatePassword}=require('../web-account-core');
function fixture(){
 const values=new Map([['bizimSkorName','Erdal'],['bizimSkorFriendToken','legacy-token']]);
 const calls=[];let mapped=null,otpError=false;
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const user={id:'u1',email:'example@example.com',email_confirmed_at:'2026-10-29'};
 const authClient={auth:{setSession:async()=>({data:{},error:null}),getUser:async()=>({data:{user}}),verifyOtp:async()=>otpError?{error:{}}:{data:{session:{user}}},updateUser:async()=>({data:{user}})},rpc:async(name,args)=>{
  calls.push([name,args]);if(name==='mobile_account_status')return {data:mapped?{linked:true,player_name:mapped}:{linked:false}};
  if(name==='mobile_link_player'){mapped=args.p_name;return {data:{player_name:mapped}}}
  return {data:{player_name:mapped,token:'new-token'}};
 }};
 const gameClient={rpc:async(name,args)=>{calls.push([name,args]);return {data:{player_name:'Erdal',linked:!!mapped}}}};
 const gateway=async body=>{calls.push(['gateway',body]);return body.action==='login'?{session:{access_token:'access',refresh_token:'refresh',user}}:{needsConfirmation:true}};
 const controller=create({authClient,gameClient,gateway,storage,deviceId:()=> 'device',onLogin:()=>{}});
 return {controller,calls,values,recreate:()=>create({authClient,gameClient,gateway,storage,deviceId:()=> 'device'}),setMapped:v=>mapped=v,setOtpError:v=>otpError=v};
}
test('password length is enforced without trimming and mismatch prevents signup',async()=>{
 assert.throws(()=>validatePassword('1234567'));assert.equal(validatePassword('12345678'),'12345678');
 const f=fixture();await assert.rejects(f.controller.signup('a@b.com','12345678','87654321'),/aynı/);
 assert.equal(f.calls.length,0);
});
test('email is verified before attaching the same legacy player; password never persists',async()=>{
 const f=fixture();await f.controller.signup(' person@example.com ','secret123','secret123');
 assert.equal(f.calls.some(c=>c[0]==='mobile_link_player'),false);
 assert.equal(f.calls.find(c=>c[0]==='gateway')[1].name,'Erdal','existing name also prevents native auto-create from duplicating this player');
 assert.equal([...f.values.values()].some(v=>String(v).includes('secret123')),false);
 await f.controller.verify('123456');
 assert.deepEqual(f.calls.find(c=>c[0]==='mobile_link_player')[1],{p_name:'Erdal',p_legacy_token:'legacy-token',p_device_id:'device'});
 assert.equal(f.values.get('bizimSkorFriendToken'),'legacy-token');
 assert.equal(f.values.has('bizimSkorEmailUpgradePending'),false);
});
test('wrong OTP leaves game and pending proof untouched',async()=>{
 const f=fixture();await f.controller.signup('a@b.com','secret123','secret123');f.setOtpError(true);
 await assert.rejects(f.controller.verify('bad'),/Kod/);assert.equal(f.values.get('bizimSkorName'),'Erdal');
 assert.equal(f.calls.some(c=>c[0]==='mobile_link_player'),false);
});
test('account switch before verification cannot attach another player',async()=>{
 const f=fixture();await f.controller.signup('a@b.com','secret123','secret123');f.values.set('bizimSkorName','Okan');
 await assert.rejects(f.controller.verify('123456'),/Oyuncu oturumu/);
 assert.equal(f.calls.some(c=>c[0]==='mobile_link_player'),false);
});
test('already-linked email belonging to someone else cannot hijack current player',async()=>{
 const f=fixture();f.setMapped('Okan');
 await assert.rejects(f.controller.attach('a@b.com','secret123'),/başka bir oyuncuya/);
 assert.equal(f.values.get('bizimSkorName'),'Erdal');assert.equal(f.values.get('bizimSkorFriendToken'),'legacy-token');
});
test('email OR username login issues a game session only after confirmed linked status',async()=>{
 for(const identifier of ['Erdal','a@b.com']){const f=fixture();f.setMapped('Erdal');await f.controller.login(identifier,'secret123');
 assert.equal(f.calls.find(c=>c[0]==='gateway')[1].identifier,identifier);assert.equal(f.values.get('bizimSkorFriendToken'),'new-token');}
});
test('unlinked login never creates a duplicate player',async()=>{
 const f=fixture();await assert.rejects(f.controller.login('a@b.com','secret123'),/bağlanmamış/);
 assert.equal(f.calls.some(c=>c[0]==='mobile_create_player'),false);assert.equal(f.values.get('bizimSkorName'),'Erdal');
});
test('pending signup resumes after page reload without saving password',async()=>{
 const f=fixture();await f.controller.signup('a@b.com','secret123','secret123');assert.equal(f.controller.pending().email,'a@b.com');
 const restored=f.recreate();assert.equal(restored.pending().email,'a@b.com');await restored.verify('123456');assert.equal(restored.pending(),null);
});

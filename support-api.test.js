const test=require('node:test');
const assert=require('node:assert/strict');
const {createPlayerSupportApi,createAdminSupportApi,createGuestSupportApi}=require('./support-api.js');

test('player list sends token only through injected rpc',async()=>{
  let call=null;
  const api=createPlayerSupportApi({getToken:()=> 'tok',rpc:async(name,args)=>{call={name,args};return{data:[{id:1}],error:null}}});
  const rows=await api.list();
  assert.equal(call.name,'list_my_support_requests');
  assert.equal(call.args.p_token,'tok');
  assert.equal(rows.length,1);
});

test('player create maps category and message',async()=>{
  let call=null;
  const api=createPlayerSupportApi({getToken:()=> 'tok',rpc:async(name,args)=>{call={name,args};return{data:9,error:null}}});
  const id=await api.create('technical','Test');
  assert.equal(call.name,'create_support_request');
  assert.deepEqual(call.args,{p_token:'tok',p_category:'technical',p_message:'Test'});
  assert.equal(id,9);
});

test('guest api uses persistent guest token and supplied display name',async()=>{
  const calls=[];
  const api=createGuestSupportApi({getGuestToken:()=> 'guest-1',getGuestName:()=> 'Misafir Erdal',rpc:async(name,args)=>{calls.push({name,args});return{data:name==='create_guest_support_request'?12:[],error:null}}});
  await api.list();
  const id=await api.create('login_pin','Giriş yapamıyorum');
  await api.markSeen(12);
  assert.equal(id,12);
  assert.deepEqual(calls,[
    {name:'list_guest_support_requests',args:{p_guest_token:'guest-1'}},
    {name:'create_guest_support_request',args:{p_guest_token:'guest-1',p_guest_name:'Misafir Erdal',p_category:'login_pin',p_message:'Giriş yapamıyorum'}},
    {name:'mark_guest_support_reply_seen',args:{p_guest_token:'guest-1',p_request_id:12}}
  ]);
});

test('missing token is rejected before rpc',async()=>{
  let calls=0;
  const api=createPlayerSupportApi({getToken:()=>'',rpc:async()=>{calls++;return{}}});
  await assert.rejects(()=>api.list(),/Oturum/);
  assert.equal(calls,0);
});

test('admin api checks admin state with same injected token',async()=>{
  const names=[];
  const api=createAdminSupportApi({getToken:()=> 'adm',rpc:async(name,args)=>{names.push({name,args});return{data:name==='is_support_admin'?true:[],error:null}}});
  assert.equal(await api.isAdmin(),true);
  await api.list('new');
  assert.equal(names[1].name,'list_support_requests');
  assert.equal(names[1].args.p_admin_token,'adm');
  assert.equal(names[1].args.p_status,'new');
});

test('rpc errors are surfaced',async()=>{
  const api=createAdminSupportApi({getToken:()=> 'adm',rpc:async()=>({data:null,error:{message:'Yetkisiz'}})});
  await assert.rejects(()=>api.isAdmin(),/Yetkisiz/);
});

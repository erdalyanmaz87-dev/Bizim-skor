const test=require('node:test');
const assert=require('node:assert/strict');
const {createGuestSupportApi}=require('./support-api.js');

test('guest support sends device capability only to edge function',async()=>{
  const calls=[];
  const api=createGuestSupportApi({
    getGuestToken:()=> 'a'.repeat(64),
    getGuestName:()=> 'Misafir Erdal',
    invoke:async(name,options)=>{calls.push({name,options});return{data:{ok:true,data:options.body.action==='guest_create'?12:[]},error:null}}
  });
  await api.list();
  assert.equal(await api.create('login_pin','Giriş yapamıyorum'),12);
  await api.markSeen(12);
  assert.deepEqual(calls.map(x=>x.options.body.action),['guest_list','guest_create','guest_seen']);
  assert.equal(calls[0].options.body.guest_token,'a'.repeat(64));
  assert.equal(calls[1].options.body.name,'Misafir Erdal');
});

const test=require('node:test');
const assert=require('node:assert/strict');
const {createAnonymousSupportApi}=require('./support-api.js');

test('anonymous support uses edge function actions',async()=>{
  const calls=[];
  const api=createAnonymousSupportApi({
    getUserId:()=> 'anon-1',
    getGuestName:()=> 'Misafir Erdal',
    invoke:async(name,options)=>{calls.push({name,options});return{data:{ok:true,data:options.body.action==='anonymous_create'?12:[]},error:null}}
  });
  await api.list();
  assert.equal(await api.create('login_pin','Giriş yapamıyorum'),12);
  await api.markSeen(12);
  assert.deepEqual(calls.map(x=>x.options.body.action),['anonymous_list','anonymous_create','anonymous_seen']);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const {createPlayerSupportController}=require('./support-player-controller.js');

test('load returns rows and unread reply count',async()=>{
  const controller=createPlayerSupportController({api:{list:async()=>[{id:1,admin_reply:'Yanıt',answered_at:'x',player_seen_reply_at:null}]},validate:()=>({ok:true}),isUnread:r=>Boolean(r.admin_reply&&!r.player_seen_reply_at)});
  const result=await controller.load();
  assert.equal(result.rows.length,1);
  assert.equal(result.unread,1);
});

test('send validates before calling api',async()=>{
  let calls=0;
  const controller=createPlayerSupportController({api:{create:async()=>{calls++;return 1},list:async()=>[]},validate:()=>({ok:false,message:'Hata'}),isUnread:()=>false});
  const result=await controller.send('technical','');
  assert.equal(result.ok,false);
  assert.equal(calls,0);
});

test('send calls api then reloads',async()=>{
  let created=null;
  const controller=createPlayerSupportController({api:{create:async(category,message)=>{created={category,message};return 9},list:async()=>[{id:9,message:'Test'}]},validate:()=>({ok:true,category:'technical',message:'Test'}),isUnread:()=>false});
  const result=await controller.send('technical','Test');
  assert.equal(result.ok,true);
  assert.deepEqual(created,{category:'technical',message:'Test'});
  assert.equal(result.rows.length,1);
});

test('markSeen delegates only valid ids',async()=>{
  let id=null;
  const controller=createPlayerSupportController({api:{markSeen:async value=>{id=value;return true},list:async()=>[]},validate:()=>({ok:true}),isUnread:()=>false});
  assert.equal((await controller.markSeen(4)).ok,true);
  assert.equal(id,4);
  assert.equal((await controller.markSeen(0)).ok,false);
});

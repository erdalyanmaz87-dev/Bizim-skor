const test=require('node:test');
const assert=require('node:assert/strict');
const {createSupportAdminController}=require('./support-admin-controller.js');

test('load passes normalized status to api',async()=>{
  let status=null;
  const controller=createSupportAdminController({api:{list:async value=>{status=value;return[{id:1,status:'new'}]}},normalizeStatus:v=>v==='all'?null:v});
  const result=await controller.load('answered');
  assert.equal(status,'answered');
  assert.equal(result.rows.length,1);
});

test('reply validates before api call',async()=>{
  let calls=0;
  const controller=createSupportAdminController({api:{reply:async()=>{calls++;return true},list:async()=>[]},validateReply:()=>({ok:false,message:'Hata'}),normalizeStatus:v=>v});
  const result=await controller.reply(1,'');
  assert.equal(result.ok,false);
  assert.equal(calls,0);
});

test('reply delegates then reloads',async()=>{
  let payload=null;
  const controller=createSupportAdminController({api:{reply:async(id,reply)=>{payload={id,reply};return true},list:async()=>[{id:1,status:'answered'}]},validateReply:()=>({ok:true,reply:'Cevap'}),normalizeStatus:v=>v});
  const result=await controller.reply(1,'Cevap','answered');
  assert.deepEqual(payload,{id:1,reply:'Cevap'});
  assert.equal(result.ok,true);
  assert.equal(result.rows[0].status,'answered');
});

test('resolve rejects invalid id',async()=>{
  const controller=createSupportAdminController({api:{resolve:async()=>true,list:async()=>[]},normalizeStatus:v=>v});
  assert.equal((await controller.resolve(0)).ok,false);
});

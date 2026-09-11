const test=require('node:test');
const assert=require('node:assert/strict');
const {createSupportBootstrap}=require('./support-bootstrap.js');
const {findPlayerActionHost}=require('./support-placement.js');

test('guest support mounts without creating capability until support is opened',async()=>{
  const store={};
  let captured=null;
  const calls=[];
  const root={
    document:{getElementById:()=>null},
    localStorage:{getItem:key=>store[key]||'',setItem:(key,value)=>{store[key]=String(value)}},
    crypto:{getRandomValues:bytes=>{for(let i=0;i<bytes.length;i++)bytes[i]=i+1;return bytes}},
    sb:{rpc:async()=>({data:[],error:null}),functions:{invoke:async()=>({data:{ok:true,data:[]},error:null})}},
    BizimSkorSupportApi:{
      createGuestSupportApi:opts=>{captured=opts;calls.push('guestApi');return{kind:'guestApi'}},
      createPlayerSupportApi:()=>{throw new Error('player api should not be used')},
      createAdminSupportApi:()=>{throw new Error('admin api should not be used')}
    },
    BizimSkorSupportInbox:{validateSupportMessage:()=>({ok:true}),hasUnreadAdminReply:()=>false},
    BizimSkorSupportAdmin:{validateAdminReply:()=>({ok:true}),normalizeSupportStatus:v=>v},
    BizimSkorSupportPlayerController:{createPlayerSupportController:opts=>({kind:opts.api.kind})},
    BizimSkorSupportAdminController:{createSupportAdminController:()=>({})},
    BizimSkorSupportPlayerView:{},BizimSkorSupportAdminView:{},BizimSkorSupportPlacement:{},BizimSkorSupportAdminPlacement:{},
    BizimSkorSupportPlayerUI:{createPlayerSupportUI:opts=>({refresh:async()=>{calls.push(['refresh',opts.lazy,opts.anonymous])}})},
    BizimSkorSupportAdminUI:{createAdminSupportUI:()=>({refreshButton:async()=>{throw new Error('admin ui should not mount')}})}
  };
  const result=await createSupportBootstrap(root).mount();
  assert.equal(result.mounted,true);
  assert.equal(result.mode,'guest');
  assert.equal(store.bizimSkorSupportGuestToken,undefined);
  assert.deepEqual(calls,['guestApi',['refresh',true,true]]);
  await captured.ensureGuestToken();
  assert.equal(store.bizimSkorSupportGuestToken.length,64);
  assert.equal(captured.getGuestToken(),store.bizimSkorSupportGuestToken);
});

test('support placement falls back to login area for guests',()=>{
  const host={};
  const forgot={parentElement:host,nextSibling:{id:'after-forgot'}};
  const doc={getElementById:id=>id==='openPinReset'?forgot:null};
  const target=findPlayerActionHost(doc);
  assert.equal(target.host,host);
  assert.equal(target.before.id,'after-forgot');
});

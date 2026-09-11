const test=require('node:test');
const assert=require('node:assert/strict');
const {createSupportBootstrap}=require('./support-bootstrap.js');
const {findPlayerActionHost}=require('./support-placement.js');

test('guest support mounts without player session and uses a persistent guest token',async()=>{
  const store={};
  const calls=[];
  const root={
    document:{},
    crypto:{randomUUID:()=> 'guest-uuid'},
    localStorage:{
      getItem:key=>store[key]||'',
      setItem:(key,value)=>{store[key]=String(value)}
    },
    sb:{rpc:async()=>({data:[],error:null})},
    BizimSkorSupportApi:{
      createGuestSupportApi:opts=>{calls.push(['guestApi',opts.getGuestToken()]);return{kind:'guestApi'}},
      createPlayerSupportApi:()=>{throw new Error('player api should not be used')},
      createAdminSupportApi:()=>{throw new Error('admin api should not be used')}
    },
    BizimSkorSupportInbox:{validateSupportMessage:()=>({ok:true}),hasUnreadAdminReply:()=>false},
    BizimSkorSupportAdmin:{validateAdminReply:()=>({ok:true}),normalizeSupportStatus:v=>v},
    BizimSkorSupportPlayerController:{createPlayerSupportController:opts=>({kind:opts.api.kind})},
    BizimSkorSupportAdminController:{createSupportAdminController:()=>({})},
    BizimSkorSupportPlayerView:{},BizimSkorSupportAdminView:{},BizimSkorSupportPlacement:{},BizimSkorSupportAdminPlacement:{},
    BizimSkorSupportPlayerUI:{createPlayerSupportUI:opts=>({refresh:async()=>{calls.push(['refresh',opts.controller.kind])}})},
    BizimSkorSupportAdminUI:{createAdminSupportUI:()=>({refreshButton:async()=>{}})}
  };
  const result=await createSupportBootstrap(root).mount();
  assert.equal(result.mounted,true);
  assert.equal(result.mode,'guest');
  assert.equal(store.bizimSkorSupportGuestToken,'guest-uuid');
  assert.deepEqual(calls,[['guestApi','guest-uuid'],['refresh','guestApi']]);
});

test('support placement falls back to login area for guests',()=>{
  const host={};
  const forgot={parentElement:host,nextSibling:{id:'after-forgot'}};
  const doc={getElementById:id=>id==='openPinReset'?forgot:null};
  const target=findPlayerActionHost(doc);
  assert.equal(target.host,host);
  assert.equal(target.before.id,'after-forgot');
});

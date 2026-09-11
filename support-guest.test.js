const test=require('node:test');
const assert=require('node:assert/strict');
const {createSupportBootstrap}=require('./support-bootstrap.js');
const {findPlayerActionHost}=require('./support-placement.js');

test('guest support creates an anonymous auth session and mounts only player support',async()=>{
  const calls=[];
  const root={
    document:{},
    localStorage:{getItem:()=>''},
    sb:{
      rpc:async()=>({data:[],error:null}),
      auth:{
        getSession:async()=>({data:{session:null},error:null}),
        signInAnonymously:async()=>({data:{session:{user:{id:'anon-1',is_anonymous:true}}},error:null})
      }
    },
    BizimSkorSupportApi:{
      createAnonymousSupportApi:opts=>{calls.push(['anonApi',opts.getUserId()]);return{kind:'anonApi'}},
      createPlayerSupportApi:()=>{throw new Error('player api should not be used')},
      createAdminSupportApi:()=>{throw new Error('admin api should not be used')}
    },
    BizimSkorSupportInbox:{validateSupportMessage:()=>({ok:true}),hasUnreadAdminReply:()=>false},
    BizimSkorSupportAdmin:{validateAdminReply:()=>({ok:true}),normalizeSupportStatus:v=>v},
    BizimSkorSupportPlayerController:{createPlayerSupportController:opts=>({kind:opts.api.kind})},
    BizimSkorSupportAdminController:{createSupportAdminController:()=>({})},
    BizimSkorSupportPlayerView:{},BizimSkorSupportAdminView:{},BizimSkorSupportPlacement:{},BizimSkorSupportAdminPlacement:{},
    BizimSkorSupportPlayerUI:{createPlayerSupportUI:opts=>({refresh:async()=>{calls.push(['refresh',opts.controller.kind])}})},
    BizimSkorSupportAdminUI:{createAdminSupportUI:()=>({refreshButton:async()=>{throw new Error('admin ui should not mount')}})}
  };
  const result=await createSupportBootstrap(root).mount();
  assert.equal(result.mounted,true);
  assert.equal(result.mode,'anonymous');
  assert.deepEqual(calls,[['anonApi','anon-1'],['refresh','anonApi']]);
});

test('support placement falls back to login area for guests',()=>{
  const host={};
  const forgot={parentElement:host,nextSibling:{id:'after-forgot'}};
  const doc={getElementById:id=>id==='openPinReset'?forgot:null};
  const target=findPlayerActionHost(doc);
  assert.equal(target.host,host);
  assert.equal(target.before.id,'after-forgot');
});

const test=require('node:test');
const assert=require('node:assert/strict');
const {createSupportBootstrap}=require('./support-bootstrap.js');
const {findPlayerActionHost}=require('./support-placement.js');

test('guest support mounts without creating auth user until support is opened',async()=>{
  let signIns=0,captured=null;
  const calls=[];
  const root={
    document:{getElementById:()=>null},localStorage:{getItem:()=>''},
    sb:{
      rpc:async()=>({data:[],error:null}),
      functions:{invoke:async()=>({data:{ok:true,data:[]},error:null})},
      auth:{
        getSession:async()=>({data:{session:null},error:null}),
        signInAnonymously:async()=>{signIns++;return{data:{session:{user:{id:'anon-1',is_anonymous:true}}},error:null}}
      }
    },
    BizimSkorSupportApi:{
      createAnonymousSupportApi:opts=>{captured=opts;calls.push('anonApi');return{kind:'anonApi'}},
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
  assert.equal(result.mode,'anonymous');
  assert.equal(signIns,0);
  assert.deepEqual(calls,['anonApi',['refresh',true,true]]);
  await captured.ensureSession();
  assert.equal(signIns,1);
  assert.equal(captured.getUserId(),'anon-1');
});

test('support placement falls back to login area for guests',()=>{
  const host={};
  const forgot={parentElement:host,nextSibling:{id:'after-forgot'}};
  const doc={getElementById:id=>id==='openPinReset'?forgot:null};
  const target=findPlayerActionHost(doc);
  assert.equal(target.host,host);
  assert.equal(target.before.id,'after-forgot');
});

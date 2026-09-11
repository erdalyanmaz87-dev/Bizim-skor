const test=require('node:test');
const assert=require('node:assert/strict');
const {createSupportBootstrap}=require('./support-bootstrap.js');

test('mount composes isolated player and admin support modules',async()=>{
  const calls=[];
  const root={document:{},localStorage:{getItem:key=>key==='bizimSkorFriendToken'?'tok':''},sb:{rpc:async()=>({data:null,error:null})},
    BizimSkorSupportApi:{createPlayerSupportApi:opts=>{calls.push(['playerApi',opts.getToken()]);return{kind:'playerApi'}},createAdminSupportApi:opts=>{calls.push(['adminApi',opts.getToken()]);return{kind:'adminApi',isAdmin:async()=>true}}},
    BizimSkorSupportInbox:{validateSupportMessage:()=>({ok:true}),hasUnreadAdminReply:()=>false},BizimSkorSupportAdmin:{validateAdminReply:()=>({ok:true}),normalizeSupportStatus:v=>v},
    BizimSkorSupportPlayerController:{createPlayerSupportController:opts=>{calls.push(['playerController',opts.api.kind]);return{kind:'playerController'}}},BizimSkorSupportAdminController:{createSupportAdminController:opts=>{calls.push(['adminController',opts.api.kind]);return{kind:'adminController'}}},
    BizimSkorSupportPlayerView:{},BizimSkorSupportAdminView:{},BizimSkorSupportPlacement:{},BizimSkorSupportAdminPlacement:{},
    BizimSkorSupportPlayerUI:{createPlayerSupportUI:opts=>({refresh:async()=>{calls.push(['playerRefresh',opts.controller.kind])}})},BizimSkorSupportAdminUI:{createAdminSupportUI:opts=>({refreshButton:async()=>{calls.push(['adminRefresh',opts.adminApi.kind])}})}};
  const result=await createSupportBootstrap(root).mount();
  assert.equal(result.mounted,true);
  assert.equal(result.mode,'player');
  assert.deepEqual(calls,[['playerApi','tok'],['adminApi','tok'],['playerController','playerApi'],['adminController','adminApi'],['playerRefresh','playerController'],['adminRefresh','adminApi']]);
});

test('mount reports missing guest transport when logged out support cannot initialize',async()=>{
  const root={document:{},localStorage:{getItem:()=>''},sb:{rpc:async()=>({})}};
  assert.deepEqual(await createSupportBootstrap(root).mount(),{mounted:false,reason:'no-guest-transport'});
});

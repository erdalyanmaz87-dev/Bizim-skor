const test=require('node:test');
const assert=require('node:assert/strict');
const {readInvite,consumeRegistrationInvite,start}=require('./invite-registration-bootstrap');

test('reads game and league attribution from invite url',()=>{
  assert.deepEqual(readInvite({search:'?invite=Erdal'}),{inviterId:'Erdal',leagueId:null});
  assert.deepEqual(readInvite({search:'?invite=Erdal&league=11111111-1111-4111-8111-111111111111'}),{inviterId:'Erdal',leagueId:'11111111-1111-4111-8111-111111111111'});
});

test('records a game invite only after a new-player session exists',async()=>{
  const calls=[];
  const result=await consumeRegistrationInvite({invite:{inviterId:'Erdal',leagueId:null},token:'session-token',newPlayerName:'Ayse',api:{async rpc(name,args){calls.push([name,args]);return{data:true,error:null}}}});
  assert.equal(result.recorded,true);
  assert.deepEqual(calls,[['record_player_invite',{p_token:'session-token',p_inviter_name:'Erdal',p_league_id:null}]]);
});

test('passes the selected league id for league invite attribution',async()=>{
  let args;
  await consumeRegistrationInvite({invite:{inviterId:'Erdal',leagueId:'11111111-1111-4111-8111-111111111111'},token:'session-token',newPlayerName:'Ayse',api:{async rpc(name,value){args={name,value};return{data:true,error:null}}}});
  assert.deepEqual(args,{name:'record_player_invite',value:{p_token:'session-token',p_inviter_name:'Erdal',p_league_id:'11111111-1111-4111-8111-111111111111'}});
});

test('rejects self invite before rpc call',async()=>{
  let called=false;
  const result=await consumeRegistrationInvite({invite:{inviterId:'Ayse'},token:'session-token',newPlayerName:' ayse ',api:{async rpc(){called=true}}});
  assert.equal(result.recorded,false);assert.equal(result.reason,'self');assert.equal(called,false);
});

test('does nothing without inviter or session token',async()=>{
  const api={async rpc(){throw new Error('must not call')}};
  assert.equal((await consumeRegistrationInvite({invite:{},token:'x',newPlayerName:'Ayse',api})).recorded,false);
  assert.equal((await consumeRegistrationInvite({invite:{inviterId:'Erdal'},token:'',newPlayerName:'Ayse',api})).recorded,false);
});

test('existing-player session event does not attribute unless registration button armed it',async()=>{
  const listeners={};let rpcCalls=0;
  const host={location:{search:'?invite=Erdal',href:'https://x.test/?invite=Erdal'},addEventListener(type,fn){listeners[type]=fn},localStorage:{getItem(){return'present'}},sb:{async rpc(){rpcCalls++;return{data:true,error:null}}},history:{replaceState(){}}};
  const doc={getElementById(){return{addEventListener(){}}},addEventListener(){}};
  assert.equal(start(host,doc),true);
  await listeners['bizimskor:session-ready']();
  assert.equal(rpcCalls,0);
});

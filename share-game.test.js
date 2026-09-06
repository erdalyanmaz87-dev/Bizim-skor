const test=require('node:test');
const assert=require('node:assert/strict');
const share=require('./share-game.js');

const gameUrl='https://bizim-skor-live.vercel.app';

test('share text contains Bizim Skor and invite url',()=>{
 const text=share.shareText(gameUrl);
 assert.match(text,/Bizim Skor’a sen de katıl/);
 assert.match(text,/https:\/\/bizim-skor-live\.vercel\.app/);
 assert.equal(share.whatsappUrl(gameUrl),'https://wa.me/?text='+encodeURIComponent(text));
});

test('league menu action directly shares selected friend league when helper exists',async()=>{
 let called=0;
 const host={BizimSkorLeagueInviteShare:{shareSelectedLeague:async()=>{called++;return true}}};
 const result=await share.shareSelectedLeagueFromMenu(host,{});
 assert.equal(result,true);
 assert.equal(called,1);
});

test('league menu action falls back to friend leagues tab when helper is unavailable',async()=>{
 let clicked=0;
 const doc={querySelector:selector=>selector==='[data-tab="friendLeagues"]'?{click(){clicked++}}:null};
 const result=await share.shareSelectedLeagueFromMenu({},doc);
 assert.equal(result,false);
 assert.equal(clicked,1);
});

test('leagueChoices exposes clear league names instead of an ambiguous current league',()=>{
 const doc={getElementById:id=>id==='friendLeagueSelect'?{options:[
  {value:'',textContent:'Lig seçin'},
  {value:'lig-1',textContent:'Mahalle Ligi'},
  {value:'lig-2',textContent:'Ofis Ligi'}
 ]}:null};
 assert.deepEqual(share.leagueChoices(doc),[
  {id:'lig-1',name:'Mahalle Ligi'},
  {id:'lig-2',name:'Ofis Ligi'}
 ]);
});

test('recordShareClick requires a valid friend session token',()=>{
 let rpcCall=null;
 const host={localStorage:{getItem:key=>key==='bizimSkorFriendToken'?'valid-session-token':''},sb:{rpc(name,args){rpcCall={name,args};return Promise.resolve({error:null})}}};
 assert.equal(share.recordShareClick(host),true);
 assert.deepEqual(rpcCall,{name:'record_game_share_click',args:{p_token:'valid-session-token',p_channel:'whatsapp'}});
 rpcCall=null;
 assert.equal(share.recordShareClick({localStorage:{getItem:()=>''},sb:host.sb}),false);
 assert.equal(rpcCall,null);
});

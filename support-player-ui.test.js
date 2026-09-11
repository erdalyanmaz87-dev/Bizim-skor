const test=require('node:test');
const assert=require('node:assert/strict');
const {createPlayerSupportUI}=require('./support-player-ui.js');

test('refresh mounts one support button with unread count',async()=>{
  const events={};const button={addEventListener:(name,fn)=>events[name]=fn};let mounted=0;
  const ui=createPlayerSupportUI({doc:{getElementById:()=>null},view:{supportButton:n=>`button:${n}`},controller:{load:async()=>({rows:[{id:1}],unread:2})},placement:{insertPlayerSupportButton:(_doc,node)=>{mounted++;assert.equal(node,button);return true}},isUnread:()=>false,makeElement:html=>{assert.equal(html,'button:2');return button}});
  const state=await ui.refresh();assert.equal(state.unread,2);assert.equal(mounted,1);assert.equal(typeof events.click,'function');
});

test('refresh updates existing button without inserting another',async()=>{
  let inserted=0;const existing={innerHTML:'',addEventListener:()=>{}};
  const ui=createPlayerSupportUI({doc:{getElementById:id=>id==='openSupportInbox'?existing:null},view:{supportButton:n=>`<button>📩 Bize Ulaşın ${n}</button>`},controller:{load:async()=>({rows:[],unread:3})},placement:{insertPlayerSupportButton:()=>{inserted++;return true}},isUnread:()=>false,makeElement:()=>({innerHTML:'📩 Bize Ulaşın 3',addEventListener:()=>{}})});
  await ui.refresh();assert.equal(inserted,0);assert.match(existing.innerHTML,/3/);
});

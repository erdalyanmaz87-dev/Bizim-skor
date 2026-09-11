const test=require('node:test');
const assert=require('node:assert/strict');
const placement=require('./support-admin-placement.js');

test('admin placement prefers live score panel parent',()=>{
  const parent={};const live={parentElement:parent};const doc={getElementById:id=>id==='adminLiveScorePanel'?live:null};
  const target=placement.findAdminSupportHost(doc);assert.equal(target.host,parent);assert.equal(target.after,live);
});

test('admin placement falls back before daily matches',()=>{
  const parent={};const daily={parentElement:parent};const doc={getElementById:id=>id==='dailyMatches'?daily:null};
  const target=placement.findAdminSupportHost(doc);assert.equal(target.host,parent);assert.equal(target.before,daily);
});

test('admin placement returns null without anchors',()=>{
  const doc={getElementById:()=>null};assert.equal(placement.findAdminSupportHost(doc),null);
});

test('placing admin button preserves its identity',()=>{
  const parent={insertBefore:()=>{}};const live={parentElement:parent,insertAdjacentElement:()=>{}};
  const doc={getElementById:id=>id==='adminLiveScorePanel'?live:null};const button={id:'openSupportAdmin'};
  assert.equal(placement.insertAdminSupportButton(doc,button),true);assert.equal(button.id,'openSupportAdmin');
});

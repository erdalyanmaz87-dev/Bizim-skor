const test=require('node:test');
const assert=require('node:assert/strict');
const placement=require('./support-placement.js');

test('logged-out placement targets login actions before pin reset',()=>{
  const loginHost={insertBefore:()=>{}};
  const profileHost={insertBefore:()=>{}};
  const pinReset={id:'openPinReset'};
  const login={parentElement:loginHost,nextSibling:pinReset};
  const update={parentElement:profileHost,nextSibling:{id:'logoutPlayer'}};
  const knownPlayer={classList:{contains:name=>name==='hide'}};
  const newPlayer={classList:{contains:()=>false}};
  const doc={getElementById:id=>({loginPlayer:login,updateProfile:update,knownPlayer,newPlayer}[id]||null)};
  const target=placement.findPlayerActionHost(doc);
  assert.equal(target.host,loginHost);
  assert.equal(target.before,pinReset);
});

test('player placement targets update profile parent',()=>{
  const parent={insertBefore:(node,ref)=>({node,ref})};
  const update={parentElement:parent,nextSibling:{id:'logout'}};
  const newPlayer={classList:{contains:name=>name==='hide'}};
  const doc={getElementById:id=>id==='updateProfile'?update:id==='newPlayer'?newPlayer:null};
  const target=placement.findPlayerActionHost(doc);
  assert.equal(target.host,parent);
  assert.equal(target.before.id,'logout');
});

test('missing profile actions returns null',()=>{
  const doc={getElementById:()=>null};
  assert.equal(placement.findPlayerActionHost(doc),null);
});

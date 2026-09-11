const test=require('node:test');
const assert=require('node:assert/strict');
const placement=require('./support-placement.js');

test('player placement targets update profile parent',()=>{
  const parent={insertBefore:(node,ref)=>({node,ref})};
  const update={parentElement:parent,nextSibling:{id:'logout'}};
  const doc={getElementById:id=>id==='updateProfile'?update:null};
  const target=placement.findPlayerActionHost(doc);
  assert.equal(target.host,parent);
  assert.equal(target.before.id,'logout');
});

test('missing profile actions returns null',()=>{
  const doc={getElementById:()=>null};
  assert.equal(placement.findPlayerActionHost(doc),null);
});

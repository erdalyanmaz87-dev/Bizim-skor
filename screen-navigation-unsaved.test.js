const test=require('node:test');
const assert=require('node:assert/strict');
const {hasInputChanges}=require('./screen-navigation-app.js');

test('generic prediction fallback detects edited enabled inputs',()=>{
  const section={querySelectorAll:()=>[
    {value:'2',defaultValue:'1'},
    {value:'0',defaultValue:'0'}
  ]};
  assert.equal(hasInputChanges(section),true);
});

test('generic prediction fallback ignores unchanged or disabled inputs',()=>{
  const section={querySelectorAll:()=>[
    {value:'1',defaultValue:'1'},
    {value:'3',defaultValue:'3'}
  ]};
  assert.equal(hasInputChanges(section),false);
});

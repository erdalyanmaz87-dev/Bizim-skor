const test=require('node:test');
const assert=require('node:assert/strict');
const {hasInputChanges,shouldCaptureGuard}=require('./screen-navigation-app.js');

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

test('prediction screens guard menu and home clicks before legacy handlers',()=>{
  assert.equal(shouldCaptureGuard('pred','general'),true);
  assert.equal(shouldCaptureGuard('championsPred','home'),true);
  assert.equal(shouldCaptureGuard('nationsPred','rules'),true);
  assert.equal(shouldCaptureGuard('general','rules'),false);
  assert.equal(shouldCaptureGuard('pred','pred'),false);
});

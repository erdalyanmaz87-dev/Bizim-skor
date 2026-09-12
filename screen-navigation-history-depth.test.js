const test=require('node:test');
const assert=require('node:assert/strict');
const {historyDepthFromState}=require('./screen-navigation-app.js');

test('history depth is read only from Bizim Skor navigation states',()=>{
  assert.equal(historyDepthFromState({bizimSkorScreen:true,screenDepth:1}),1);
  assert.equal(historyDepthFromState({bizimSkorScreen:true,screenDepth:4}),4);
  assert.equal(historyDepthFromState({screenDepth:4}),null);
  assert.equal(historyDepthFromState(null),null);
});

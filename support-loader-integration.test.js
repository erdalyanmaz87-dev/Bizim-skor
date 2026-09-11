const test=require('node:test');
const assert=require('node:assert/strict');
const loader=require('./ui-integration-loader.js');

test('ui integration loads support entry on feature preview',()=>{
  assert.equal(loader.scriptOrder().includes('support-entry.js'),true);
});

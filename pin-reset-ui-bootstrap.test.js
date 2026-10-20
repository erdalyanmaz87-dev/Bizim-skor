const assert=require('assert');
const ui=require('./pin-reset-ui.js');
assert.strictEqual(typeof ui.mountUiIntegration,'function');
const appended=[];
const doc={
  querySelector:()=>null,
  createElement:()=>({dataset:{}}),
  head:{appendChild:s=>appended.push(s)}
};
assert.strictEqual(ui.mountUiIntegration(doc),true);
assert.strictEqual(appended.length,1);
assert.strictEqual(appended[0].src,'ui-integration-loader.js?v=20261020-ranking-sticky-v1');
assert.strictEqual(appended[0].defer,true);
assert.strictEqual(appended[0].dataset.bizimUiBootstrap,'1');
console.log('pin reset ui bootstrap ok');

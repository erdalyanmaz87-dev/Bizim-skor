const test=require('node:test');
const assert=require('node:assert/strict');
const {scriptOrder}=require('./ui-integration-loader.js');

test('navigation modules load before adapters and support bootstrap',()=>{
  const order=scriptOrder();
  const core=order.indexOf('screen-navigation.js');
  const ui=order.indexOf('screen-navigation-ui.js');
  const profile=order.indexOf('player-profile.js');
  const adapter=order.indexOf('screen-navigation-adapter.js');
  const support=order.indexOf('support-entry.js');
  assert.ok(core>=0&&ui>core&&profile>ui&&adapter>profile&&support>adapter);
});

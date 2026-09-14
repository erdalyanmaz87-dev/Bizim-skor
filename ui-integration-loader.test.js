const assert=require('assert');
const loader=require('./ui-integration-loader.js');
const order=loader.scriptOrder();

assert(order.includes('ranking-movement.js'));
assert(order.includes('ranking-movement-ui.js'));
assert(order.indexOf('ranking-movement.js')<order.indexOf('weekly-ranking-strip.js'));
assert(order.indexOf('ranking-movement.js')<order.indexOf('ranking-movement-ui.js'));
assert(order.indexOf('home-prediction-priority.js')<order.indexOf('prediction-week-cards.js'));
assert(order.indexOf('prediction-week-cards.js')<order.indexOf('home-dashboard-ui.js'));
assert(order.indexOf('horizontal-menu.js')<order.indexOf('chat-unread-indicator.js'));
assert(order.indexOf('screen-navigation-adapter.js')<order.indexOf('support-entry.js'));
assert(order.indexOf('fixture-ui.js')<order.indexOf('fixture-week-strip.js'));
assert.strictEqual(new Set(order).size,order.length);

console.log('ui integration loader order ok');

const assert=require('assert');
const loader=require('./ui-integration-loader.js');
assert.deepStrictEqual(loader.scriptOrder(),[
  'week-strip.js',
  'header-ui.js',
  'home-prediction-priority.js',
  'horizontal-menu.js',
  'chat-unread-indicator.js',
  'prediction-week-cards.js',
  'weekly-ranking-strip.js',
  'fixture-data.js',
  'fixture-ui.js',
  'fixture-week-strip.js',
  'history-week-strip.js'
]);
const order=loader.scriptOrder();
assert(order.indexOf('home-prediction-priority.js')<order.indexOf('prediction-week-cards.js'));
assert(order.indexOf('horizontal-menu.js')<order.indexOf('chat-unread-indicator.js'));
assert(order.indexOf('fixture-ui.js')<order.indexOf('fixture-week-strip.js'));
console.log('ui-integration-loader ok');

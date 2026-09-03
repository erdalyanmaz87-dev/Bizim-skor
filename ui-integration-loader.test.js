const assert=require('assert');
const loader=require('./ui-integration-loader.js');
assert.deepStrictEqual(loader.scriptOrder(),[
  'week-strip.js',
  'header-ui.js',
  'horizontal-menu.js',
  'prediction-week-cards.js',
  'weekly-ranking-strip.js',
  'fixture-week-strip.js',
  'history-week-strip.js'
]);
console.log('ui-integration-loader ok');

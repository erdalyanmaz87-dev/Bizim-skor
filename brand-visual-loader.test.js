const assert=require('assert');
const loader=require('./ui-integration-loader.js');
const order=loader.scriptOrder();
assert.ok(order.includes('brand-assets.js'),'brand assets module must load');
assert.ok(order.includes('brand-visual-ui.js'),'brand visual decorator must load');
assert.ok(order.indexOf('brand-assets.js')<order.indexOf('header-ui.js'),'brand assets must load before UI modules');
assert.ok(order.indexOf('brand-visual-ui.js')>order.indexOf('home-dashboard-ui.js'),'decorator must load after home dashboard');
assert.ok(order.indexOf('brand-visual-ui.js')>order.indexOf('fixture-ui.js'),'decorator must load after fixture UI');
console.log('brand visual loader ok');

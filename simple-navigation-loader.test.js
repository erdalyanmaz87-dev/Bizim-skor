const assert=require('assert');
const loader=require('./ui-integration-loader.js');
const order=loader.scriptOrder();

assert(order.includes('simple-navigation.js'));
assert(order.indexOf('horizontal-menu.js')<order.indexOf('simple-navigation.js'));
assert(order.indexOf('simple-navigation.js')<order.indexOf('chat-unread-indicator.js'));

console.log('simple-navigation-loader ok');

const assert=require('assert');
const loader=require('./ui-integration-loader.js');
const order=loader.scriptOrder();
assert(order.includes('player-museum.js'));
assert(order.indexOf('player-profile.js')<order.indexOf('player-museum.js'));
console.log('player-museum-loader ok');

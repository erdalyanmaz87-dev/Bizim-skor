const assert=require('assert');
const fix=require('./share-game-menu-fix.js');
const loader=require('./ui-integration-loader.js');

const html=fix.modalMarkup();
assert.match(html,/id="bsShareGameMenuModal"/);
assert.match(html,/Oyuna Davet Et/);
assert.match(html,/Arkadaş Ligine Davet Et/);
assert.strictEqual(fix.isShareGameAction({dataset:{simpleAccount:'shareGame'}}),true);
assert.strictEqual(fix.isShareGameAction({dataset:{simpleAccount:'support'}}),false);

const order=loader.scriptOrder();
assert(order.includes('share-game-menu-fix.js'),'share menu fix must be loaded');
assert(order.indexOf('share-game.js')<order.indexOf('share-game-menu-fix.js'),'share menu fix must load after share-game.js');

console.log('share game menu fix ok');

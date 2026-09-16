const assert=require('assert');
const polish=require('./champions-prediction-polish.js');
const loader=require('./ui-integration-loader.js');

const grouped=polish.groupByKickoffTime([
  {id:1,time:'19.45'},
  {id:2,time:'19.45'},
  {id:3,time:'22.00'}
]);
assert.deepStrictEqual(grouped.map(g=>[g.time,g.items.map(x=>x.id)]),[
  ['19.45',[1,2]],
  ['22.00',[3]]
]);
assert.strictEqual(polish.cleanTeamName('19.45\nParis Saint-Germain'),'Paris Saint-Germain');
assert.strictEqual(polish.cleanTeamName('22.00 Real Madrid'),'Real Madrid');

assert.strictEqual(polish.canonicalLogoName('Slavia Prag'),'Slavia Praha');
assert.strictEqual(polish.canonicalLogoName('Leipzig'),'RB Leipzig');
assert.strictEqual(polish.canonicalLogoName('Bayern Münih'),'Bayern Munchen');
assert.strictEqual(polish.canonicalLogoName('Stuttgart'),'VfB Stuttgart');

const order=loader.scriptOrder();
assert(order.includes('champions-prediction-polish.js'),'CL polish layer must be loaded');
assert(order.indexOf('robot-prediction-ui.js')<order.indexOf('champions-prediction-polish.js'),'CL polish must load after SkorBot UI');
assert(order.indexOf('brand-assets.js')<order.indexOf('champions-prediction-polish.js'),'CL polish must load after brand assets');

console.log('champions prediction polish ok');

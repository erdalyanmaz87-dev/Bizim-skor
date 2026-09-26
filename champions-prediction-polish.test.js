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

const brandedRoma={
  querySelector(selector){return selector==='.bs-team-name'?{textContent:'Roma'}:null},
  textContent:'RRoma'
};
assert.strictEqual(polish.readTeamName(brandedRoma),'Roma','fallback initial must not prefix team name');
const plainRoma={querySelector(){return null},textContent:'Roma'};
assert.strictEqual(polish.readTeamName(plainRoma),'Roma');
assert.strictEqual(polish.brandNeedsRepair('22.00Arsenal','Arsenal',false,true),true,'time-prefixed brand must be rebuilt with the real team logo');
assert.strictEqual(polish.brandNeedsRepair('Club Brugge','Club Brugge',false,true),true,'known team fallback must be replaced by its logo');
assert.strictEqual(polish.brandNeedsRepair('Barcelona','Barcelona',true,true),false);

const order=loader.scriptOrder();
assert(order.includes('champions-prediction-polish.js'),'CL polish layer must be loaded');
assert(order.indexOf('robot-prediction-ui.js')<order.indexOf('champions-prediction-polish.js'),'CL polish must load after SkorBot UI');
assert(order.indexOf('brand-assets.js')<order.indexOf('champions-prediction-polish.js'),'CL polish must load after brand assets');

console.log('champions prediction polish ok');

const assert=require('assert');
const polish=require('./champions-prediction-polish.js');

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
console.log('champions prediction polish ok');

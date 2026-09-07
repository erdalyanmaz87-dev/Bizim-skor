const assert=require('assert');
const ranking=require('./season-invite-ranking.js');

const rows=[
  {name:'Ali',pts:10,ex:2,cr:5,createdAt:'2026-08-20',seasonInvites:0},
  {name:'Mevlüt',pts:10,ex:1,cr:4,createdAt:'2026-08-25',seasonInvites:1},
  {name:'Veli',pts:10,ex:3,cr:6,createdAt:'2026-08-19',seasonInvites:0},
  {name:'Ayşe',pts:9,ex:4,cr:7,createdAt:'2026-08-18',seasonInvites:5}
];
const sorted=ranking.sortRows(rows);
assert.deepStrictEqual(sorted.map(x=>x.name),['Mevlüt','Veli','Ali','Ayşe']);
assert.strictEqual(sorted[0].seasonInvites,1);
console.log('season invite ranking tests passed');

const test=require('node:test');
const assert=require('node:assert/strict');
const {cardDefinitions}=require('./screen-nav-support-card.js');

test('home support cards expose player contact and admin inbox independently',()=>{
  const defs=cardDefinitions();
  assert.deepEqual(defs.map(x=>x.sourceId),['openSupportInbox','openSupportAdmin']);
  assert.match(defs[0].label,/Bize Ulaşın/);
  assert.match(defs[1].label,/Gelen Kutusu/);
});

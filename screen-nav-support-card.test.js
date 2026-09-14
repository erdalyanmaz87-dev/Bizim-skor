const test=require('node:test');
const assert=require('node:assert/strict');
const {cardDefinitions}=require('./screen-nav-support-card.js');

test('home dashboard no longer exposes support or admin inbox cards',()=>{
  assert.deepEqual(cardDefinitions(),[]);
});

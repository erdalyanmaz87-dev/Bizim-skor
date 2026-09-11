const test=require('node:test');
const assert=require('node:assert/strict');
const {modules,predictionTarget}=require('./screen-navigation-adapter.js');

test('adapter loads navigation runtime and detail hooks in order',()=>{
  assert.deepEqual(modules,[
    'screen-navigation-app.js',
    'screen-nav-profile-hook.js',
    'screen-nav-support-card.js',
    'screen-nav-support-hook.js'
  ]);
});

test('special prediction cards map to their dedicated screens',()=>{
  const card=names=>({classList:{contains:name=>names.includes(name)}});
  assert.equal(predictionTarget(card(['theme-champions'])),'championsPred');
  assert.equal(predictionTarget(card(['theme-nations'])),'nationsPred');
  assert.equal(predictionTarget(card([])),null);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const nav=require('./screen-navigation.js');

test('detail screen can sit on top of a ranking screen',()=>{
  let state=nav.createNavigationState();
  state=nav.pushScreen(state,{id:'general'});
  state=nav.pushScreen(state,{id:'playerProfile',title:'Erdal',context:{player:'Erdal'}});
  assert.equal(nav.currentScreen(state).id,'playerProfile');
  state=nav.popScreen(state);
  assert.equal(nav.currentScreen(state).id,'general');
});

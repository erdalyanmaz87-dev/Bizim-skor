const test=require('node:test');
const assert=require('node:assert/strict');
const {
  createNavigationState,
  pushScreen,
  popScreen,
  currentScreen,
  rememberScroll,
  canonicalScreenId,
  missingRegisteredScreens
}=require('./screen-navigation.js');

test('nested back returns to the real previous screen',()=>{
  let state=createNavigationState();
  state=pushScreen(state,{id:'general',title:'Süper Lig Genel Sıralaması'});
  state=pushScreen(state,{id:'playerProfile',title:'Erdal'});
  assert.equal(currentScreen(state).id,'playerProfile');
  state=popScreen(state);
  assert.equal(currentScreen(state).id,'general');
  state=popScreen(state);
  assert.equal(currentScreen(state).id,'home');
});

test('scroll is remembered per screen',()=>{
  let state=createNavigationState();
  state=pushScreen(state,{id:'general',title:'Genel'});
  state=rememberScroll(state,842);
  assert.equal(currentScreen(state).scrollY,842);
  state=pushScreen(state,{id:'playerProfile',title:'Oyuncu'});
  state=popScreen(state);
  assert.equal(currentScreen(state).scrollY,842);
});

test('popping root keeps home as the root screen',()=>{
  let state=createNavigationState();
  state=popScreen(state);
  assert.equal(currentScreen(state).id,'home');
});

test('all visible horizontal menu screens are registered',()=>{
  const menuIds=['arena','championsRanking','nationsRanking','general','live','resultsWeek','footballCenter','friendLeagues','history','rules','chat'];
  assert.deepEqual(missingRegisteredScreens(menuIds),[]);
  assert.equal(canonicalScreenId('live'),'weeklyRankings');
});

test('prediction, support and detail screens are registered too',()=>{
  const extraIds=['pred','championsPred','nationsPred','playerProfile','supportPlayer','supportAdmin'];
  assert.deepEqual(missingRegisteredScreens(extraIds),[]);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const {missingRegisteredScreens,SCREEN_REGISTRY}=require('./screen-navigation.js');
const {orderMenuTabs}=require('./horizontal-menu.js');

test('navigation registry covers every horizontal menu screen',()=>{
  const menuIds=['arena','championsRanking','nationsRanking','general','weeklyRankings','resultsWeek','footballCenter','friendLeagues','history','rules','chat'];
  const ordered=orderMenuTabs(menuIds);
  assert.deepEqual(missingRegisteredScreens(ordered),[]);
});

test('navigation registry covers prediction, support and detail screens',()=>{
  const required=['pred','championsPred','nationsPred','playerProfile','supportPlayer','supportAdmin'];
  assert.deepEqual(missingRegisteredScreens(required),[]);
  assert.equal(SCREEN_REGISTRY.supportAdmin.adminOnly,true);
  assert.equal(SCREEN_REGISTRY.playerProfile.detail,true);
});

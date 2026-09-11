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

test('screen shell helper renders back header and content mount',()=>{
  const {screenShellMarkup,screenTitle}=require('./screen-navigation-ui.js');
  const html=screenShellMarkup({id:'general',title:'Süper Lig Genel Sıralaması'});
  assert.match(html,/data-screen-back/);
  assert.match(html,/Süper Lig Genel Sıralaması/);
  assert.match(html,/bs-screen-content/);
  assert.equal(screenTitle({id:'rules'}),'Kurallar');
});

test('tab adapter keeps home as root and maps every child target',()=>{
  const {shouldNavigateTab,resolveSectionId}=require('./screen-navigation-app.js');
  assert.equal(shouldNavigateTab('home'),false);
  assert.equal(shouldNavigateTab('general'),true);
  assert.equal(shouldNavigateTab('live'),true);
  assert.equal(resolveSectionId('live'),'weeklyRankings');
  ['arena','championsRanking','nationsRanking','general','resultsWeek','footballCenter','friendLeagues','history','rules','chat','pred'].forEach(id=>assert.equal(shouldNavigateTab(id),true,id));
});

test('browser history helpers mark only Bizim Skor navigation states',()=>{
  const {makeHistoryState,isNavigationHistoryState}=require('./screen-navigation-app.js');
  const root=makeHistoryState({id:'home'},1,{other:'keep'});
  const child=makeHistoryState({id:'general'},2);
  assert.equal(root.other,'keep');
  assert.equal(root.screenId,'home');
  assert.equal(root.screenDepth,1);
  assert.equal(isNavigationHistoryState(root),true);
  assert.equal(child.screenDepth,2);
  assert.equal(isNavigationHistoryState({screenDepth:2}),false);
  assert.equal(isNavigationHistoryState(null),false);
});

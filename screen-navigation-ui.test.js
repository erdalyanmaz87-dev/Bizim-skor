const test=require('node:test');
const assert=require('node:assert/strict');
const {screenTitle,shouldNavigateFromTab,historyStateFor}=require('./screen-navigation-ui.js');

test('screen title comes from registry with explicit title override',()=>{
  assert.equal(screenTitle('general'),'Süper Lig Genel Sıralaması');
  assert.equal(screenTitle('general','Özel Başlık'),'Özel Başlık');
});

test('home is root and does not open as a child screen',()=>{
  assert.equal(shouldNavigateFromTab('home'),false);
  assert.equal(shouldNavigateFromTab('general'),true);
  assert.equal(shouldNavigateFromTab('weeklyRankings'),true);
});

test('history state identifies Bizim Skor navigation entries',()=>{
  assert.deepEqual(historyStateFor('general',2),{bizimSkorScreen:true,id:'general',depth:2});
});

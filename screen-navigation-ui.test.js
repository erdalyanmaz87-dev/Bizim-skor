const test=require('node:test');
const assert=require('node:assert/strict');
const {screenTitle,screenShellMarkup}=require('./screen-navigation-ui.js');

test('screen title comes from registry or explicit title',()=>{
  assert.equal(screenTitle({id:'general'}),'Süper Lig Genel Sıralaması');
  assert.equal(screenTitle({id:'general',title:'Özel Başlık'}),'Özel Başlık');
});

test('screen shell contains one back action and content host',()=>{
  const html=screenShellMarkup({id:'general'});
  assert.match(html,/data-screen-back/);
  assert.match(html,/data-screen-content/);
  assert.match(html,/Süper Lig Genel Sıralaması/);
});

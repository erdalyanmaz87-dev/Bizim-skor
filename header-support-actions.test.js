const test=require('node:test');
const assert=require('node:assert/strict');
const {buildHeaderMarkup}=require('./header-ui.js');

test('modern header exposes support actions for logged in players',()=>{
  const html=buildHeaderMarkup('Erdal',true);
  assert.match(html,/id="bsHeaderSupport"/);
  assert.match(html,/📩 Bize Ulaşın/);
});

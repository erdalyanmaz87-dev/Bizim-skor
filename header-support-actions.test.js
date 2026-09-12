const test=require('node:test');
const assert=require('node:assert/strict');
const {buildHeaderMarkup}=require('./header-ui.js');

test('modern header exposes support actions for logged in players',()=>{
  const html=buildHeaderMarkup('Erdal',true);
  assert.match(html,/id="bsHeaderSupport"/);
  assert.match(html,/📩 Bize Ulaşın/);
});

test('guest header exposes support beside login',()=>{
  const html=buildHeaderMarkup('');
  assert.match(html,/id="bsHeaderSupport"/);
  assert.match(html,/bs-header-guest-actions/);
  assert.match(html,/Giriş Yap/);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const entry=require('./support-entry.js');

test('support dependency order is unique and bootstrap is last',()=>{
  const scripts=entry.scriptOrder();
  assert.equal(new Set(scripts).size,scripts.length);
  assert.equal(scripts.at(-1),'support-bootstrap.js');
  assert.ok(scripts.indexOf('support-api.js')<scripts.indexOf('support-player-controller.js'));
  assert.ok(scripts.indexOf('support-player-view.js')<scripts.indexOf('support-player-ui.js'));
  assert.ok(scripts.indexOf('support-admin-view.js')<scripts.indexOf('support-admin-ui.js'));
});

test('support entry owns only its dedicated stylesheet',()=>{
  assert.equal(entry.styleHref(),'support-inbox.css');
});

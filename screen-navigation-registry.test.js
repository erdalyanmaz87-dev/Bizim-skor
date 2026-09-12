const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {missingRegisteredScreens,SCREEN_REGISTRY}=require('./screen-navigation.js');

function realHorizontalMenuIds(){
  const source=fs.readFileSync(path.join(__dirname,'horizontal-menu.js'),'utf8');
  const match=source.match(/const ORDER=\[([^\]]+)\]/);
  assert.ok(match,'horizontal menu ORDER list not found');
  return [...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
}

test('navigation registry covers every real horizontal menu screen',()=>{
  const menuIds=realHorizontalMenuIds();
  assert.deepEqual(missingRegisteredScreens(menuIds),[]);
});

test('navigation registry covers prediction, support and detail screens',()=>{
  const required=['pred','championsPred','nationsPred','playerProfile','supportPlayer','supportAdmin'];
  assert.deepEqual(missingRegisteredScreens(required),[]);
  assert.equal(SCREEN_REGISTRY.supportAdmin.adminOnly,true);
  assert.equal(SCREEN_REGISTRY.playerProfile.detail,true);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('./index.html','utf8');

test('oyuncu adı ancak aynı oyuncunun güvenli oturumu kurulduktan sonra etkinleşir',()=>{
  const login=html.slice(html.indexOf("document.getElementById('loginPlayer').onclick"),html.indexOf("document.getElementById('createPlayer').onclick"));
  assert.ok(login.indexOf('await createFriendSession(n,sessionPin)')<login.indexOf('setAuthPlayer(n)'));
  assert.doesNotMatch(login,/friend session skipped/);
});

test('yeni kayıt da oturum kurulmadan oyuncuyu etkin göstermez',()=>{
  const register=html.slice(html.indexOf("document.getElementById('createPlayer').onclick"),html.indexOf("document.getElementById('save').onclick"));
  assert.ok(register.indexOf('await createFriendSession(c.data,p1)')<register.indexOf('setAuthPlayer(c.data)'));
  assert.doesNotMatch(register,/friend session skipped/);
});

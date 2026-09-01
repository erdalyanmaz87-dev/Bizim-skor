const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const edge=fs.readFileSync('supabase/functions/push-subscribe/index.ts','utf8');
const client=fs.readFileSync('push-notifications.js','utf8');
const html=fs.readFileSync('index.html','utf8');

test('abonelik kaydı oyuncuyu güvenli oturumdan belirler',()=>{
  assert.match(edge,/friend_session_player/);
  assert.doesNotMatch(edge,/b\.player_name/);
});

test('DELETE yalnız oturum sahibinin aynı cihaz uç noktasını siler',()=>{
  assert.match(edge,/req\.method==='DELETE'/);
  assert.match(edge,/\.eq\('player_name',player\)/);
  assert.match(edge,/\.eq\('endpoint',endpoint\)/);
});

test('profilde bildirim düğmesi ve gerekli betikler bulunur',()=>{
  assert.match(html,/push-notifications-core\.js/);
  assert.match(html,/push-notifications\.js/);
  assert.match(client,/button\.id='pushToggle'/);
});

test('istemci bildirim aboneliğini cihaz bazında kapatır',()=>{
  assert.match(client,/method:'DELETE'/);
  assert.match(client,/subscription\.unsubscribe\(\)/);
  assert.match(client,/Bildirimleri Kapat/);
  assert.doesNotMatch(client,/Maç başlangıcı, gol/);
});
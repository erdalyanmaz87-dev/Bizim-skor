const test=require('node:test');
const assert=require('node:assert/strict');
const player=require('./support-player-view.js');
const admin=require('./support-admin-view.js');

test('player panel contains contact form and history',()=>{
  const html=player.panel([]);
  assert.match(html,/Bize Ulaşın/);
  assert.match(html,/supportCategory/);
  assert.match(html,/supportMessage/);
  assert.match(html,/Mesajlarım/);
});

test('player card shows administrator reply',()=>{
  const html=player.card({category:'technical',message:'Test',status:'answered',admin_reply:'Kontrol edildi'});
  assert.match(html,/Yönetici cevabı/);
  assert.match(html,/Kontrol edildi/);
});

test('admin panel contains four filters',()=>{
  const html=admin.panel([], 'new');
  assert.match(html,/Yeni/);
  assert.match(html,/Cevaplandı/);
  assert.match(html,/Çözüldü/);
  assert.match(html,/Tümü/);
});

test('admin card contains reply and resolve actions',()=>{
  const html=admin.card({id:1,player_name:'Oyuncu',category:'technical',message:'Test',status:'new'});
  assert.match(html,/Cevapla/);
  assert.match(html,/Çözüldü/);
});

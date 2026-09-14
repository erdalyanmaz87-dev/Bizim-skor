const test=require('node:test');
const assert=require('node:assert/strict');
const {cardDefinitions,sync}=require('./screen-nav-support-card.js');

test('Benim Durumum destek ve yönetici gelen kutusu kartı üretmez',()=>{
  assert.deepEqual(cardDefinitions(),[]);
});

test('eski Benim Durumum kartlarını temizler, asıl menü ve yönetim düğmelerini korur',()=>{
  const removed=[];
  const nodes={
    bsSupportHomeCard:{remove:()=>removed.push('support-card')},
    bsAdminInboxCard:{remove:()=>removed.push('admin-card')},
    openSupportInbox:{remove:()=>removed.push('support-source')},
    openSupportAdmin:{remove:()=>removed.push('admin-source')}
  };
  sync({getElementById:id=>nodes[id]||null});
  assert.deepEqual(removed,['support-card','admin-card']);
});

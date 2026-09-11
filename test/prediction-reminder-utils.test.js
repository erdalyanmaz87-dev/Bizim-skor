const test=require('node:test');
const assert=require('node:assert/strict');
const Reminder=require('../prediction-reminder-utils');

test('uyarı yalnız ilk maça 24 saat veya daha az kaldığında ve tahmin eksikken oluşur',()=>{
  const now='2026-09-11T08:00:00+03:00';
  assert.equal(Reminder.shouldWarn({now,deadline:'2026-09-12T07:59:59+03:00',complete:false}),true);
  assert.equal(Reminder.shouldWarn({now,deadline:'2026-09-12T08:00:01+03:00',complete:false}),false);
  assert.equal(Reminder.shouldWarn({now,deadline:'2026-09-12T07:59:59+03:00',complete:true}),false);
  assert.equal(Reminder.shouldWarn({now,deadline:'2026-09-11T07:59:59+03:00',complete:false}),false);
});

test('tüm yarışmalar aynı metin şablonunu kullanır',()=>{
  assert.equal(Reminder.message('5. Hafta'),'5. Hafta tahminlerinizi henüz tamamlamadınız. İlk maça 24 saatten az kaldı. Şimdi tahmin yapmak ister misiniz?');
  assert.equal(Reminder.message('Şampiyonlar Ligi'),'Şampiyonlar Ligi tahminlerinizi henüz tamamlamadınız. İlk maça 24 saatten az kaldı. Şimdi tahmin yapmak ister misiniz?');
  assert.equal(Reminder.message('Uluslar Ligi 1. Hafta'),'Uluslar Ligi 1. Hafta tahminlerinizi henüz tamamlamadınız. İlk maça 24 saatten az kaldı. Şimdi tahmin yapmak ister misiniz?');
});

test('birden fazla eksik varsa en yakın başlayacak yarışma seçilir',()=>{
  const rows=[
    {key:'super:5',deadline:'2026-09-11T20:00:00+03:00'},
    {key:'champions:2',deadline:'2026-09-11T18:00:00+03:00'}
  ];
  assert.equal(Reminder.pickNext(rows).key,'champions:2');
});

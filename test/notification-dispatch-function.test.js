const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('supabase/functions/notification-dispatch/index.ts','utf8');

test('dağıtıcı cron sırrını doğrular ve genel kullanıma açık komut kabul etmez',()=>{
  assert.match(source,/authorize_notification_cron/);
  assert.match(source,/x-cron-secret/);
  assert.doesNotMatch(source,/b\.title|b\.body/);
});

test('tam skor bildirimi oyuncu ve cihaz bazında tekilleştirilir',()=>{
  assert.match(source,/exact:/);
  assert.match(source,/push_delivery_log/);
  assert.match(source,/delivery_key/);
  assert.match(source,/Şu an tam biliyorsun/);
});

test('eksik tahminlere 24 ve 3 saat hatırlatması hazırlanır',()=>{
  assert.match(source,/reminderThreshold/);
  assert.match(source,/predictionIsComplete/);
  assert.match(source,/24 saat|3 saat/);
});

test('geçersiz cihaz uç noktaları temizlenir',()=>{
  assert.match(source,/status===404\|\|status===410/);
  assert.match(source,/push_subscriptions.*delete/s);
});
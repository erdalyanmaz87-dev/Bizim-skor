const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sql=fs.readFileSync('supabase/migrations/20260901123000_notification_delivery_scheduler.sql','utf8');

test('teslim günlüğü RLS ile korunur ve olay başına tek kayıt tutar',()=>{
  assert.match(sql,/create table public\.push_delivery_log/i);
  assert.match(sql,/delivery_key text not null unique/i);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/revoke all on table public\.push_delivery_log from anon, authenticated/i);
});

test('bildirim görevi beş dakikada bir Vault sırrıyla çalışır',()=>{
  assert.match(sql,/notification-dispatch-every-five-minutes/i);
  assert.match(sql,/'\*\/5 \* \* \* \*'/);
  assert.match(sql,/notification_cron_secret/i);
  assert.match(sql,/x-cron-secret/i);
});

test('cron yetkilendirme işlevini yalnız servis rolü çağırır',()=>{
  assert.match(sql,/authorize_notification_cron/i);
  assert.match(sql,/revoke all on function public\.authorize_notification_cron\(text\) from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\.authorize_notification_cron\(text\) to service_role/i);
});
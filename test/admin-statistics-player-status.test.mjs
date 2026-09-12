import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const dashboardPath=path.join(root,'admin-statistics-dashboard.js');
const migrationPath=path.join(root,'supabase/migrations/20260913001000_admin_assistant_player_status.sql');

test('yönetici istatistikleri özel Edge Function yerine yetkili RPC kullanır',()=>{
  const source=fs.readFileSync(dashboardPath,'utf8');
  assert.match(source,/\.rpc\(['"]get_admin_statistics_dashboard['"]/);
  assert.doesNotMatch(source,/functions\/v1\/admin-statistics/);
});

test('yönetici asistanı isim listelerini ayrı başlıklarda gösterir',()=>{
  const source=fs.readFileSync(dashboardPath,'utf8');
  assert.match(source,/Güncel Hafta Tahmin Yapanlar/);
  assert.match(source,/Güncel Hafta Tahmin Yapmayanlar/);
  assert.match(source,/Bildirimleri Açanlar/);
  assert.match(source,/24 Saat Uyarısı · Evet/);
  assert.match(source,/24 Saat Uyarısı · Daha Sonra/);
});

test('RPC yalnız yönetici tokenı ile çalışır ve hassas push anahtarlarını döndürmez',()=>{
  assert.equal(fs.existsSync(migrationPath),true,'admin statistics migration eksik');
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/is_support_admin\(p_token\)/i);
  assert.match(sql,/revoke all on function public\.get_admin_statistics_dashboard\(text\)/i);
  assert.match(sql,/grant execute on function public\.get_admin_statistics_dashboard\(text\) to anon/i);
  assert.match(sql,/push_subscriptions/i);
  assert.doesNotMatch(sql,/jsonb_build_object\([^;]*(endpoint|p256dh|auth)/is);
  assert.match(sql,/player_launch_events/i);
  assert.match(sql,/prediction_reminder_events/i);
});

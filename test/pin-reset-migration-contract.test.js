const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const migrationPath='supabase/migrations/20260831123000_registered_device_pin_reset.sql';

test('PIN sıfırlama yalnız kayıtlı cihaz ve dört rakamla çalışır',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/p\.device_id\s*=\s*p_device_id/i);
  assert.match(sql,/p_new_pin\s*!~\s*'\^\[0-9\]\{4\}\$'/i);
  assert.match(sql,/crypt\(p_new_pin\s*,\s*gen_salt\('bf'\)\)/i);
});

test('başarılı sıfırlama eski oturumları aynı işlevde siler',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/delete\s+from\s+public\.friend_league_sessions/i);
  assert.match(sql,/force_pin_once\s*=\s*false/i);
});

test('denemeler RLS ile korunur ve RPC sınırlı çalıştırma yetkisi verir',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/alter table public\.pin_reset_attempts enable row level security/i);
  assert.match(sql,/create policy "PIN reset attempts are never directly accessible"[\s\S]*using \(false\)[\s\S]*with check \(false\)/i);
  assert.match(sql,/revoke all on public\.pin_reset_attempts from anon, authenticated/i);
  assert.match(sql,/revoke all on function public\.reset_player_pin_from_registered_device\(text,text,text\) from public/i);
  assert.match(sql,/grant execute on function public\.reset_player_pin_from_registered_device\(text,text,text\) to anon, authenticated/i);
});

test('beş başarısız deneme ve 15 dakika sınırı vardır',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/v_failed_count\s*>=\s*5/i);
  assert.match(sql,/interval '15 minutes'/i);
});

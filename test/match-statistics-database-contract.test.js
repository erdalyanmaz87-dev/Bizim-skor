const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationPath=path.join(__dirname,'../supabase/migrations/20260905173000_match_statistics_snapshots.sql');

test('maç istatistikleri önbelleği salt okunur RLS ile korunur',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/create table(?: if not exists)? public\.match_statistics_snapshots/i);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/grant select on public\.match_statistics_snapshots to anon,authenticated/i);
  assert.match(sql,/revoke (?:all|insert,update,delete) on public\.match_statistics_snapshots from public,anon,authenticated/i);
  assert.match(sql,/create policy "match statistics are readable"/i);
});

test('haftalık çalışma tekilleştirilir ve bütçe on isteği aşamaz',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/sync_key text not null unique/i);
  assert.match(sql,/request_budget integer not null check \(request_budget between 1 and 10\)/i);
  assert.match(sql,/request_count integer not null default 0 check \(request_count between 0 and 10\)/i);
  assert.match(sql,/p_purpose not in \('live_score','football_center','match_statistics'\)/i);
});

test('otomatik hazırlık yalnız maçsız günde ve eksik gelecek hafta için çalışır',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/create or replace function public\.match_statistics_week_due/i);
  assert.match(sql,/not exists[\s\S]*Europe\/Istanbul/i);
  assert.match(sql,/count\(f\.id\)[\s\S]*count\(s\.fixture_id\)/i);
});

test('oyun istemcisi yalnız tek fikstürün hazırlanmış verisini okuyabilir',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/create or replace function public\.get_match_statistics\(p_fixture_id bigint\)/i);
  assert.match(sql,/grant execute on function public\.get_match_statistics\(bigint\) to anon,authenticated/i);
});

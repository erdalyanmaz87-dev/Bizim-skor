const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'../supabase/migrations/20260909211000_bizim_skor_league_period_automation.sql');

function sql(){return fs.readFileSync(file,'utf8')}

test('bakım fonksiyonu yalnız süresi dolmuş açık dönemi işler',()=>{
  const source=sql();
  assert.match(source,/create or replace function public\.maintain_league_periods/i);
  assert.match(source,/where\s+status\s*=\s*'open'/i);
  assert.match(source,/ends_at\s*<=\s*now\(\)/i);
  assert.match(source,/for update/i);
});

test('dönem kapanır ve sonraki dönem aynı sınır anında başlar',()=>{
  const source=sql();
  assert.match(source,/close_league_period\(v_period_id\)/i);
  assert.match(source,/open_next_league_period\([\s\S]*v_period_id[\s\S]*v_ends_at[\s\S]*v_ends_at\s*\+\s*interval\s*'28 days'/i);
});

test('otomasyon idempotent ve tek açık dönem kuralına dayanır',()=>{
  const source=sql();
  assert.match(source,/if\s+v_period_id\s+is\s+null\s+then\s+return\s+false/i);
  assert.match(source,/open_next_league_period/i);
});

test('cron işi saatlik çalışır ve eski aynı isimli işi önce kaldırır',()=>{
  const source=sql();
  assert.match(source,/jobname\s*=\s*'bizim-skor-league-period-maintenance'/i);
  assert.match(source,/cron\.unschedule/i);
  assert.match(source,/cron\.schedule\([\s\S]*'bizim-skor-league-period-maintenance'[\s\S]*'0 \* \* \* \*'/i);
  assert.match(source,/maintain_league_periods\(\)/i);
});

test('bakım fonksiyonu tarayıcı rollerine kapalıdır',()=>{
  const source=sql();
  assert.match(source,/revoke execute on function public\.maintain_league_periods\(\) from public,anon,authenticated/i);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const bootstrapFile=path.join(__dirname,'../supabase/migrations/20260909210750_bizim_skor_league_first_period_bootstrap.sql');
const automationFile=path.join(__dirname,'../supabase/migrations/20260909211000_bizim_skor_league_period_automation.sql');
const bootstrapSql=()=>fs.readFileSync(bootstrapFile,'utf8');
const automationSql=()=>fs.readFileSync(automationFile,'utf8');

test('ilk lig dönemini otomatik açan bootstrap fonksiyonu vardır',()=>{
  const source=bootstrapSql();
  assert.match(source,/create or replace function public\.bootstrap_first_league_period\(\)/i);
  assert.match(source,/public\.initialize_first_league_period\(v_start_at,v_end_at\)/i);
});

test('ilk dönem aynı sezonun 5. hafta ilk maçında başlar ve 9. hafta ilk maçında biter',()=>{
  const source=bootstrapSql();
  assert.match(source,/f\.week=5/i);
  assert.match(source,/min\(f\.kickoff\)/i);
  assert.match(source,/f\.week=9/i);
  assert.match(source,/v_end_at<=v_start_at/i);
});

test('5 ve 9. hafta aynı sezonda bulunmadan ilk dönem açılmaz',()=>{
  const source=bootstrapSql();
  assert.match(source,/v_season is null or v_start_at is null/i);
  assert.match(source,/v_end_at is null/i);
  assert.match(source,/return false/i);
});

test('bootstrap mükerrer ilk dönem oluşturmaz',()=>{
  const source=bootstrapSql();
  assert.match(source,/exists\s*\(select 1 from public\.league_periods\)/i);
});

test('saatlik bakım açık dönem yoksa önce bootstrap dener',()=>{
  const source=automationSql();
  assert.match(source,/if v_period_id is null then[\s\S]*bootstrap_first_league_period\(\)/i);
  assert.match(source,/if not public\.bootstrap_first_league_period\(\) then[\s\S]*return false/i);
});

test('bootstrap tarayıcı rollerine kapalıdır',()=>{
  const source=bootstrapSql();
  assert.match(source,/revoke execute on function public\.bootstrap_first_league_period\(\) from public,anon,authenticated/i);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'../supabase/migrations/20260909211000_bizim_skor_league_period_automation.sql');

function sql(){return fs.readFileSync(file,'utf8')}

test('bakım fonksiyonu açık dönemi inceler',()=>{
  const source=sql();
  assert.match(source,/create or replace function public\.maintain_league_periods/i);
  assert.match(source,/where\s+status\s*=\s*'open'/i);
  assert.match(source,/for update/i);
});

test('bakım önce açık dönemde tamamlanan tüm yarışma turlarını yeniler',()=>{
  const source=sql();
  assert.match(source,/refresh_league_period_rounds\(v_period_id\)/i);
});

test('dönem başlangıç Süper Lig sezon ve haftasına sabitlenir',()=>{
  const source=sql();
  assert.match(source,/with\s+week_starts\s+as\s*\([\s\S]*select\s+f\.season\s*,\s*f\.week\s*,\s*min\(f\.kickoff\)\s+as\s+first_kickoff/i);
  assert.match(source,/ws\.first_kickoff\s*>=\s*v_starts_at/i);
  assert.match(source,/v_start_week/i);
  assert.match(source,/v_start_season/i);
});

test('yalnız başlangıç haftasından itibaren dört ardışık Süper Lig haftası kapanış için sayılır',()=>{
  const source=sql();
  assert.match(source,/f\.season\s*=\s*v_start_season/i);
  assert.match(source,/f\.week\s+between\s+v_start_week\s+and\s+v_start_week\+3/i);
  assert.match(source,/count\(distinct\s+f\.week\)\s*=\s*4/i);
});

test('bir Süper Lig haftası ancak tüm fikstür sonuçları girildiyse tamamlanmış sayılır',()=>{
  const source=sql();
  assert.match(source,/public\.fixtures/i);
  assert.match(source,/public\.results/i);
  assert.match(source,/result_count\s*=\s*fixture_count/i);
});

test('dönem 4 tamamlanmış Süper Lig haftasından önce kapanmaz',()=>{
  const source=sql();
  assert.match(source,/v_completed_super_weeks\s*<\s*4/i);
  assert.match(source,/return\s+false/i);
});

test('sonraki hafta yüklenmeden mevcut dönem kapatılmaz',()=>{
  const source=sql();
  assert.match(source,/v_next_week\s*:=\s*v_start_week\+4/i);
  assert.match(source,/where\s+f\.season=v_start_season[\s\S]*f\.week=v_next_week/i);
  assert.match(source,/if\s+v_next_start\s+is\s+null\s+then\s+return\s+false/i);
  assert.ok(source.indexOf('if v_next_start is null') < source.indexOf('close_league_period(v_period_id)'));
});

test('4. ardışık Süper Lig haftası tamamlanınca dönem kapanır ve yenisi bir sonraki haftadan açılır',()=>{
  const source=sql();
  assert.match(source,/close_league_period\(v_period_id\)/i);
  assert.match(source,/open_next_league_period/i);
  assert.doesNotMatch(source,/interval\s*'28 days'/i);
});

test('Şampiyonlar Ligi ve Uluslar Ligi dönem kapanış sayacına dahil edilmez',()=>{
  const source=sql();
  const completedWeeksBlock=source.match(/with\s+target_weeks[\s\S]*?v_completed_super_weeks/gi)?.join('\n')||'';
  assert.doesNotMatch(completedWeeksBlock,/champions_league_fixtures/i);
  assert.doesNotMatch(completedWeeksBlock,/nations_league_fixtures/i);
});

test('cron işi saatlik çalışır ve eski aynı isimli işi önce kaldırır',()=>{
  const source=sql();
  assert.match(source,/jobname\s*=\s*'bizim-skor-league-period-maintenance'/i);
  assert.match(source,/cron\.unschedule/i);
  assert.match(source,/cron\.schedule\([\s\S]*'bizim-skor-league-period-maintenance'[\s\S]*'0 \* \* \* \*'/i);
});

test('bakım fonksiyonu tarayıcı rollerine kapalıdır',()=>{
  const source=sql();
  assert.match(source,/revoke execute on function public\.maintain_league_periods\(\) from public,anon,authenticated/i);
});

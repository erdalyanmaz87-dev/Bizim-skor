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

test('bir Süper Lig haftası ancak tüm fikstür sonuçları girildiyse tamamlanmış sayılır',()=>{
  const source=sql();
  assert.match(source,/public\.fixtures/i);
  assert.match(source,/public\.results/i);
  assert.match(source,/count\(distinct\s+f\.id\)\s+as\s+fixture_count/i);
  assert.match(source,/count\(distinct\s+r\.fixture_id\)\s+as\s+result_count/i);
  assert.match(source,/group by\s+f\.season\s*,\s*f\.week/i);
  assert.match(source,/result_count\s*=\s*fixture_count/i);
});

test('dönem 4 tamamlanmış Süper Lig haftasından önce kapanmaz',()=>{
  const source=sql();
  assert.match(source,/v_completed_super_weeks\s*<\s*4/i);
  assert.match(source,/return\s+false/i);
});

test('4. Süper Lig haftası tamamlanınca dönem kapanır ve yenisi açılır',()=>{
  const source=sql();
  assert.match(source,/close_league_period\(v_period_id\)/i);
  assert.match(source,/open_next_league_period/i);
  assert.doesNotMatch(source,/interval\s*'28 days'/i);
});

test('Şampiyonlar Ligi ve Uluslar Ligi dönem kapanış sayacına dahil edilmez',()=>{
  const source=sql();
  const completedWeeksBlock=source.match(/with\s+super_weeks[\s\S]*?v_completed_super_weeks/gi)?.join('\n')||'';
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

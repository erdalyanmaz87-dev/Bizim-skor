const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'../supabase/migrations/20260909210000_bizim_skor_league_next_period.sql');

function sql(){return fs.readFileSync(file,'utf8')}

test('yeni dönem yalnız kapalı önceki dönemden açılır',()=>{
  const source=sql();
  assert.match(source,/create or replace function public\.open_next_league_period/i);
  assert.match(source,/where id\s*=\s*p_previous_period_id[\s\S]*for update/i);
  assert.match(source,/v_previous_status\s*<>\s*'closed'/i);
  assert.match(source,/where status\s*=\s*'open'/i);
});

test('önceki dönem to_league değeri yeni döneme taşınır',()=>{
  const source=sql();
  assert.match(source,/league_history/i);
  assert.match(source,/h\.to_league/i);
  assert.match(source,/coalesce\(h\.to_league,\s*'bronze'\)/i);
});

test('geçmişi olmayan gerçek katılımcı Bronzdan başlar',()=>{
  const source=sql();
  assert.match(source,/predictions/i);
  assert.match(source,/champions_league_predictions/i);
  assert.match(source,/nations_league_predictions/i);
  assert.match(source,/coalesce\(h\.to_league,\s*'bronze'\)/i);
});

test('yeni dönem kapasite ve kontenjanlarını yeniden kilitler',()=>{
  const source=sql();
  assert.match(source,/league_allocate_capacities\(v_count\)/i);
  assert.match(source,/league_promotion_slots\(v_capacities\)/i);
  assert.match(source,/locked_capacities/i);
  assert.match(source,/locked_promotion_slots/i);
});

test('yeni dönem üyelikleri sıfır turla ve uygunsuz başlar',()=>{
  const source=sql();
  assert.match(source,/valid_round_count[\s\S]*performance_score[\s\S]*exact_score_count/i);
  assert.match(source,/false\s*,\s*0\s*,\s*null\s*,\s*0\s*,\s*null\s*,\s*'none'/i);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const path='supabase/migrations/20260831170000_week4_and_secure_super_league_predictions.sql';

test('4. hafta dokuz maç ve doğru UTC saatleriyle eklenir',()=>{
  const sql=fs.readFileSync(path,'utf8');
  assert.equal((sql.match(/'2026\/27',4,/g)||[]).length,9);
  assert.match(sql,/Başakşehir','Galatasaray','2026-09-04 17:00:00\+00'/);
  assert.match(sql,/Göztepe','Gaziantep FK','2026-09-07 17:00:00\+00'/);
  assert.match(sql,/on conflict\s*\(id\)\s*do update/i);
});

test('sunucu oturumu doğrular ve yalnız seçili haftayı ilk maçtan önce kaydeder',()=>{
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/digest\(p_token\s*,\s*'sha256'\)/i);
  assert.match(sql,/expires_at\s*>\s*now\(\)/i);
  assert.match(sql,/min\(kickoff\)[\s\S]*now\(\)/i);
  assert.match(sql,/jsonb_array_length\(p_predictions\)\s*<>\s*v_fixture_count/i);
  assert.match(sql,/grant execute on function public\.save_super_league_week_predictions/i);
});

test('tahminlerde haftanın bütün maçları tek kez ve 0-20 aralığında doğrulanır',()=>{
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/count\(distinct fixture_id\)/i);
  assert.match(sql,/home_score between 0 and 20/i);
  assert.match(sql,/away_score between 0 and 20/i);
  assert.match(sql,/on conflict\s*\(player_name\s*,\s*fixture_id\)/i);
});

test('işlev varsayılan PUBLIC yetkisini kaldırır ve yalnız anonim uygulama rolüne açılır',()=>{
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/revoke insert\s*,\s*update\s*,\s*delete on public\.predictions from public\s*,\s*anon\s*,\s*authenticated/i);
  assert.match(sql,/revoke execute on function public\.save_super_league_week_predictions[^;]+from public\s*,\s*authenticated/i);
  assert.match(sql,/grant execute on function public\.save_super_league_week_predictions[^;]+to anon/i);
});

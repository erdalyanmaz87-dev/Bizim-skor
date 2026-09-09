const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const file=path.join(__dirname,'../supabase/migrations/20260909205000_bizim_skor_league_inactivity_relegation.sql');
const sql=()=>fs.readFileSync(file,'utf8');

test('kapanış uygun oyuncular için ayrı eligible_rank üretir',()=>{
  const source=sql();
  assert.match(source,/eligible_ranks/i);
  assert.match(source,/row_number\(\)\s+over\([\s\S]*partition by m\.league_code[\s\S]*order by m\.rank_in_league/i);
  assert.match(source,/where m\.period_id=p_period_id\s+and m\.is_eligible/i);
});

test('yükselme seçimi ham lig sırası yerine eligible_rank kullanır',()=>{
  const source=sql();
  assert.match(source,/er\.eligible_rank<=v_down_champions/i);
  assert.match(source,/er\.eligible_rank<=v_down_elite/i);
  assert.match(source,/er\.eligible_rank<=v_down_gold/i);
  assert.match(source,/er\.eligible_rank<=v_down_silver/i);
});

test('normal düşüş alt sıradaki uygun oyunculara eligible_rank ile uygulanır',()=>{
  const source=sql();
  assert.match(source,/er\.eligible_rank>v_eligible_champions-v_regular_down_champions/i);
  assert.match(source,/er\.eligible_rank>v_eligible_elite-v_regular_down_elite/i);
  assert.match(source,/er\.eligible_rank>v_eligible_gold-v_regular_down_gold/i);
  assert.match(source,/er\.eligible_rank>v_eligible_silver-v_regular_down_silver/i);
});

test('iki tur şartını tamamlamayan oyuncunun otomatik bir alt lig düşüşü korunur',()=>{
  const source=sql();
  assert.match(source,/not m\.is_eligible and m\.league_code='champions' then 'elite'/i);
  assert.match(source,/not m\.is_eligible and m\.league_code='elite' then 'gold'/i);
  assert.match(source,/not m\.is_eligible and m\.league_code='gold' then 'silver'/i);
  assert.match(source,/not m\.is_eligible and m\.league_code='silver' then 'bronze'/i);
  assert.match(source,/not m\.is_eligible and m\.league_code='bronze' then 'bronze'/i);
});

test('uygun olmayan oyuncu kontenjan doldurmak için yükseltilmez',()=>{
  const source=sql();
  const decisions=source.match(/decisions as \([\s\S]*?\n  \)\n  insert into public\.league_history/i)?.[0]||'';
  assert.match(decisions,/when m\.is_eligible and m\.league_code='elite'/i);
  assert.match(decisions,/when m\.is_eligible and m\.league_code='gold'/i);
  assert.match(decisions,/when m\.is_eligible and m\.league_code='silver'/i);
  assert.match(decisions,/when m\.is_eligible and m\.league_code='bronze'/i);
  assert.doesNotMatch(decisions,/when not m\.is_eligible[^\n]*then 'champions'/i);
});

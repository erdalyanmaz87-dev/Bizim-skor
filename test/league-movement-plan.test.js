const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const membershipsFile=path.join(__dirname,'../supabase/migrations/20260909200000_bizim_skor_league_memberships.sql');
const closeFile=path.join(__dirname,'../supabase/migrations/20260909205000_bizim_skor_league_inactivity_relegation.sql');
const memberships=()=>fs.readFileSync(membershipsFile,'utf8');
const closeSql=()=>fs.readFileSync(closeFile,'utf8');

test('ortak hareket planı helperı tanımlıdır',()=>{
  const source=memberships();
  assert.match(source,/create or replace function public\.league_movement_plan\(\s*p_period_id bigint\s*\)/i);
  for(const field of [
    'promote_elite','promote_gold','promote_silver','promote_bronze',
    'regular_down_champions','regular_down_elite','regular_down_gold','regular_down_silver'
  ]) assert.match(source,new RegExp(field,'i'));
});

test('hareket planı yalnız uygun oyuncuları yükseltilebilir havuzda sayar',()=>{
  const source=memberships();
  assert.match(source,/count\(\*\) filter\(where league_code='elite' and is_eligible\)/i);
  assert.match(source,/count\(\*\) filter\(where league_code='gold' and is_eligible\)/i);
  assert.match(source,/count\(\*\) filter\(where league_code='silver' and is_eligible\)/i);
  assert.match(source,/count\(\*\) filter\(where league_code='bronze' and is_eligible\)/i);
});

test('canlı promotion_status ortak hareket planı ve eligible_rank kullanır',()=>{
  const source=memberships();
  assert.match(source,/eligible_ordered/i);
  assert.match(source,/league_movement_plan\(p_period_id\)/i);
  assert.match(source,/eo\.eligible_rank<=mp\.promote_elite/i);
  assert.match(source,/eo\.eligible_rank<=mp\.promote_gold/i);
  assert.match(source,/eo\.eligible_rank<=mp\.promote_silver/i);
  assert.match(source,/eo\.eligible_rank<=mp\.promote_bronze/i);
  assert.match(source,/eo\.eligible_rank>eo\.eligible_size-mp\.regular_down_champions/i);
});

test('dönem kapanışı da aynı hareket planını kullanır',()=>{
  const source=closeSql();
  assert.match(source,/league_movement_plan\(p_period_id\)/i);
  assert.match(source,/v_promote_elite/i);
  assert.match(source,/v_promote_gold/i);
  assert.match(source,/v_promote_silver/i);
  assert.match(source,/v_promote_bronze/i);
});

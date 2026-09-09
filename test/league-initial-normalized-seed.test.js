const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const seedFile=path.join(__dirname,'../supabase/migrations/20260909204500_bizim_skor_league_initial_seed.sql');
const membershipsFile=path.join(__dirname,'../supabase/migrations/20260909200000_bizim_skor_league_memberships.sql');
const roundsFile=path.join(__dirname,'../supabase/migrations/20260909193000_bizim_skor_league_rounds.sql');
const baseFile=path.join(__dirname,'../supabase/migrations/20260909190000_bizim_skor_leagues.sql');
const seedSql=()=>fs.readFileSync(seedFile,'utf8');
const membershipsSql=()=>fs.readFileSync(membershipsFile,'utf8');
const roundsSql=()=>fs.readFileSync(roundsFile,'utf8');
const baseSql=()=>fs.readFileSync(baseFile,'utf8');

test('ilk yerleştirme eski genel sıralamayı kullanmaz',()=>{
  const source=seedSql();
  assert.doesNotMatch(source,/get_super_league_general_ranking/i);
  assert.match(source,/league_historical_seed_scores/i);
});

test('ilk seed yalnız aynı sezonun Süper Lig 3 ve 4 haftasını kullanır',()=>{
  const source=seedSql();
  assert.match(source,/seed_season/i);
  assert.match(source,/f\.week\s+in\s*\(3\s*,\s*4\)/i);
  assert.match(source,/f\.season\s*=\s*ss\.season/i);
  assert.doesNotMatch(source,/champions_league_fixtures/i);
  assert.doesNotMatch(source,/nations_league_fixtures/i);
  assert.match(source,/league_normalized_performance/i);
});

test('eksik hafta sıfır kabul edilip iki haftaya bölünür',()=>{
  const source=seedSql();
  assert.match(source,/coalesce\(w3\.performance_score,0\)/i);
  assert.match(source,/coalesce\(w4\.performance_score,0\)/i);
  assert.match(source,/\/\s*2\.0/i);
});

test('hiç tamamlanmış turu olmayan katılımcı sıfır normalize puanla kalır',()=>{
  const source=seedSql();
  assert.match(source,/coalesce\(h\.performance_score,0\)/i);
  assert.match(source,/coalesce\(h\.valid_round_count,0\)/i);
});

test('ilk seed eşitlik sırası performans davet tur tam skor ham puan ve oyuncu id şeklindedir',()=>{
  const source=seedSql();
  assert.match(source,/player_invites/i);
  assert.match(source,/order by\s+s\.performance_score desc[\s\S]*s\.invite_count desc[\s\S]*s\.valid_round_count desc[\s\S]*s\.exact_score_count desc[\s\S]*s\.raw_points desc[\s\S]*s\.player_id/i);
});

test('tur ve üyelik tabloları ham puanı saklar',()=>{
  assert.match(baseSql(),/league_round_performance[\s\S]*raw_points bigint/i);
  assert.match(baseSql(),/league_memberships[\s\S]*raw_points bigint/i);
  assert.match(roundsSql(),/raw_points/i);
});

test('dönem içi lig eşitlik sırası performans davet tur tam skor ham puan ve oyuncu id şeklindedir',()=>{
  const source=membershipsSql();
  assert.match(source,/player_invites/i);
  assert.match(source,/order by\s+m\.performance_score desc nulls last[\s\S]*coalesce\(i\.invite_count,0\) desc[\s\S]*m\.valid_round_count desc[\s\S]*m\.exact_score_count desc[\s\S]*m\.raw_points desc[\s\S]*m\.player_id/i);
});

test('başlangıç üyeliği normalize puanı ve lig içi başlangıç sırasını gösterir ama dönem turunu sıfırdan başlatır',()=>{
  const source=seedSql();
  assert.match(source,/performance_score[\s\S]*rank_in_league/i);
  assert.match(source,/false\s*,\s*0\s*,\s*s\.performance_score/i);
});

test('lig tablosu iki tur şartı dolmadan da üyeleri gösterir',()=>{
  const source=membershipsSql();
  const tableFn=source.match(/create or replace function public\.get_league_table[\s\S]*?revoke execute on function public\.refresh_league_memberships/i)?.[0]||'';
  assert.doesNotMatch(tableFn,/and\s+m\.is_eligible/i);
});

test('dönem içi sıralama herkesi sıralar ancak yükselme düşme durumu yalnız uygun oyunculara verilir',()=>{
  const source=membershipsSql();
  assert.match(source,/from public\.league_memberships m[\s\S]*where m\.period_id=p_period_id/i);
  assert.match(source,/when\s+not m\.is_eligible then 'none'/i);
});

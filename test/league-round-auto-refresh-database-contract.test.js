const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const file=path.join(__dirname,'../supabase/migrations/20260909212000_bizim_skor_league_round_auto_refresh.sql');
const sql=()=>fs.readFileSync(file,'utf8');

test('açık dönem için tamamlanmış turları otomatik yenileyen fonksiyon vardır',()=>{
  const source=sql();
  assert.match(source,/create or replace function public\.refresh_league_period_rounds\(p_period_id bigint\)/i);
  assert.match(source,/public\.refresh_league_round/i);
  assert.match(source,/public\.refresh_league_memberships/i);
});

test('Süper Lig Şampiyonlar Ligi ve Uluslar Ligi ayrı ayrı keşfedilir',()=>{
  const source=sql();
  for(const table of ['fixtures','champions_league_fixtures','nations_league_fixtures']){
    assert.match(source,new RegExp(`public\\.${table}`,'i'));
  }
  for(const results of ['results','champions_league_results','nations_league_results']){
    assert.match(source,new RegExp(`public\\.${results}`,'i'));
  }
});

test('yalnız dönem başladıktan sonra başlayan ve skorları tamamen dolu turlar işlenir',()=>{
  const source=sql();
  assert.match(source,/min\(f\.kickoff\)\s*>=\s*v_starts_at/i);
  const nonNullCounts=[...source.matchAll(/count\(distinct\s+r\.fixture_id\)\s+filter\s*\(where\s+r\.home_score\s+is\s+not\s+null\s+and\s+r\.away_score\s+is\s+not\s+null\)\s*=\s*count\(distinct\s+f\.id\)/gi)];
  assert.equal(nonNullCounts.length,3);
});

test('round key sezon ve hafta ile oluşturulur',()=>{
  const source=sql();
  assert.match(source,/season\s*\|\|\s*':'\s*\|\|\s*week/i);
});

test('otomatik yenileme tarayıcı rollerine kapalıdır',()=>{
  const source=sql();
  assert.match(source,/revoke execute on function public\.refresh_league_period_rounds\(bigint\) from public,anon,authenticated/i);
});

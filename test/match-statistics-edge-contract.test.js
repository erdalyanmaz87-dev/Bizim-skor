const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const edgePath=path.join(__dirname,'../supabase/functions/match-statistics-sync/index.ts');

test('sağlayıcı anahtarı yalnız sunucu ortamından okunur',()=>{
  const source=fs.readFileSync(edgePath,'utf8');
  assert.match(source,/Deno\.env\.get\('API_FOOTBALL_KEY'\)/);
  assert.doesNotMatch(source,/NEXT_PUBLIC|VITE_API_FOOTBALL/);
  assert.match(source,/x-football-center-secret/);
});

test('haftalık bütçe tek işlemle ağ çağrılarından önce ayrılır',()=>{
  const source=fs.readFileSync(edgePath,'utf8');
  const reserveAt=source.indexOf("reserve_api_football_requests");
  const seasonFetchAt=source.indexOf("provider('fixtures'");
  assert.ok(reserveAt>0);
  assert.ok(seasonFetchAt>reserveAt);
  assert.match(source,/p_count:requestBudget/);
});

test('puan durumu yeniden çekilmez ve mevcut Futbol Merkezi önbelleğinden okunur',()=>{
  const source=fs.readFileSync(edgePath,'utf8');
  assert.match(source,/from\('football_center_snapshots'\)/);
  assert.match(source,/eq\('category','standings'\)/);
  assert.doesNotMatch(source,/provider\('standings'/);
});

test('başarılı fikstürler tek tek saklanır ve başarısız olan eski veriyi silmez',()=>{
  const source=fs.readFileSync(edgePath,'utf8');
  assert.match(source,/from\('match_statistics_snapshots'\)\.upsert/);
  assert.doesNotMatch(source,/from\('match_statistics_snapshots'\)\.delete/);
  assert.match(source,/saved\.length\?'partial':'failed'/);
});

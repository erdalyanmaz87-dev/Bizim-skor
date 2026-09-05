const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const edgePath=path.join(__dirname,'../supabase/functions/match-statistics-sync/index.ts');

test('eşitleme yalnız sunucu sırrıyla yetkilendirilir',()=>{
  const source=fs.readFileSync(edgePath,'utf8');
  assert.match(source,/authorizeRequest/);
  assert.match(source,/authorize_football_center_cron/);
  assert.match(source,/x-football-center-secret/);
});

test('istatistik hazırlığı sağlayıcı kontörü kullanmadan oyun sonuçlarından yapılır',()=>{
  const source=fs.readFileSync(edgePath,'utf8');
  assert.match(source,/from\('results'\)/);
  assert.match(source,/buildLocalFixtureSnapshot/);
  assert.doesNotMatch(source,/reserve_api_football_requests/);
  assert.doesNotMatch(source,/x-apisports-key/);
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

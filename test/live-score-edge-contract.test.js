const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'..','supabase','functions','live-score-sync','index.ts');

test('Edge Function sırları sunucuda tutar ve çağrıyı doğrular',()=>{
  const source=fs.readFileSync(file,'utf8');
  assert.match(source,/LIVE_SCORE_CRON_SECRET/);
  assert.match(source,/API_FOOTBALL_KEY/);
  assert.match(source,/x-cron-secret/i);
  assert.doesNotMatch(source,/console\.log\([^)]*(API_FOOTBALL_KEY|authorization|headers)/i);
});

test('maç yoksa kota kullanmaz ve 95 sınırında durur',()=>{
  const source=fs.readFileSync(file,'utf8');
  assert.match(source,/active_fixture_count\s*===\s*0/);
  assert.match(source,/request_count\s*>=\s*95/);
  assert.match(source,/record_live_score_request/);
});

test('tüm canlı maçları tek sağlayıcı isteğiyle alır',()=>{
  const source=fs.readFileSync(file,'utf8');
  assert.match(source,/https:\/\/v3\.football\.api-sports\.io\/fixtures\?live=all/);
  assert.equal((source.match(/fetch\(API_URL/g)||[]).length,1);
});

test('otomatik sonuç gözlem bayrağı ile kapatılabilir',()=>{
  const source=fs.readFileSync(file,'utf8');
  assert.match(source,/AUTO_FINALIZE_RESULTS/);
  assert.match(source,/finalize_live_score_result/);
});

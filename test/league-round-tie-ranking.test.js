const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const file=path.join(__dirname,'../supabase/migrations/20260909193000_bizim_skor_league_rounds.sql');
const sql=()=>fs.readFileSync(file,'utf8');

test('tur sırası eşit performanslı oyunculara ortak rank verir',()=>{
  const source=sql();
  const rankUses=[...source.matchAll(/rank\(\)\s+over\(order by\s+s\.points desc\s*,\s*s\.exact_count desc\s*,\s*s\.correct_count desc\s*\)/gi)];
  assert.equal(rankUses.length,3);
});

test('normalize tur sırasına kayıt zamanı veya oyuncu adı karıştırılmaz',()=>{
  const source=sql();
  const rankedBlocks=[...source.matchAll(/\), ranked as \([\s\S]*?from scored s\s*\)/gi)].map(m=>m[0]);
  assert.equal(rankedBlocks.length,3);
  for(const block of rankedBlocks){
    assert.doesNotMatch(block,/created_at/i);
    assert.doesNotMatch(block,/player_name\s+collate/i);
  }
});

test('eşit rank sonrası standart yarışma sırası korunur dense rank kullanılmaz',()=>{
  const source=sql();
  assert.doesNotMatch(source,/dense_rank\s*\(/i);
});

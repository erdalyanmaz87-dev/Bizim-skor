const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const sql=fs.readFileSync('supabase/migrations/20260901090000_hybrid_podium_rankings.sql','utf8');
const html=fs.readFileSync('index.html','utf8');
const denseUi=fs.readFileSync('dense-ranking-ui.js','utf8');

test('oyuncu kayıt tarihini güvenli dizin rpcsi ile sunar',()=>{
  assert.match(sql,/create or replace function public\.list_player_ranking_directory\(p_token text\)/i);
  assert.match(sql,/returns table\(name text,is_active boolean,registration_order bigint\)/i);
  assert.match(sql,/friend_session_player\(p_token\) is null/i);
  assert.doesNotMatch(sql,/returns table\([^)]*created_at/i);
  assert.match(sql,/revoke all on function public\.list_player_ranking_directory\(text\) from public/i);
});

test('web sıralaması kayıt tarihini dizinden alır',()=>{
  assert.match(html,/list_player_ranking_directory/);
  assert.match(html,/window\.playerCreatedAt=new Map/);
  assert.match(denseUi,/createdAt:window\.playerCreatedAt/);
});

test('ilk üç puan basamağı ortak, sonrası tekil sıra olur',()=>{
  assert.match(sql,/dense_rank\(\) over\(order by .*points desc\)/i);
  assert.match(sql,/case when .*point_rank<=3 then .*point_rank else 3\+.*tail_rank end/i);
  assert.match(sql,/exact_count desc.*correct_count desc.*created_at/i);
});

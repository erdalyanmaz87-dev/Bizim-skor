const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationPath=path.join(__dirname,'..','supabase','migrations','20260912193600_restore_rule_eight_rankings.sql');

test('rule 8 migration restores shared podium ranks and removes invite tie-breakers',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  for(const fn of [
    'get_super_league_general_ranking',
    'get_friend_league_ranking',
    'get_champions_league_ranking',
    'get_nations_league_ranking'
  ]) assert.match(sql,new RegExp(`create or replace function public\.${fn}\b`,'i'));
  assert.match(sql,/dense_rank\(\)\s+over\s*\(order by\s+[^)]*points\s+desc\)/i);
  assert.match(sql,/case\s+when\s+[^\n]*point_rank\s*<=\s*3\s+then\s+[^\n]*point_rank/i);
  assert.match(sql,/exact_count\s+desc[\s\S]*correct_count\s+desc[\s\S]*created_at/i);
  assert.doesNotMatch(sql,/invite_count[\s\S]*display_rank/i);
});

test('Arena week 3/4 seed uses the same Rule 8 weekly display rank',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/create or replace function public\.league_historical_seed_scores\b/i);
  assert.match(sql,/dense_rank\(\)\s+over\s*\(\s*partition by\s+s\.season\s*,\s*s\.week\s+order by\s+s\.points\s+desc\s*\)/i);
  assert.match(sql,/case\s+when\s+p\.point_rank\s*<=\s*3\s+then\s+p\.point_rank/i);
  assert.match(sql,/order by\s+p\.points\s+desc\s*,\s*p\.exact_count\s+desc\s*,\s*p\.correct_count\s+desc\s*,\s*p\.created_at/i);
});

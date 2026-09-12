const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationPath=path.join(__dirname,'..','supabase','migrations','20260912193600_restore_rule_eight_rankings.sql');

test('Rule 8 uses points, season invites, exact, correct and registration in order',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  for(const fn of [
    'get_super_league_general_ranking',
    'get_friend_league_ranking',
    'get_champions_league_ranking',
    'get_nations_league_ranking',
    'get_champions_league_weekly_ranking',
    'get_nations_league_weekly_ranking'
  ]) assert.match(sql,new RegExp(`create or replace function public\.${fn}\b`,'i'));
  assert.match(sql,/count\(distinct lower\(invited_name\)\)/i);
  assert.match(sql,/points\s+desc[\s\S]*invite_count[\s\S]*exact_count\s+desc[\s\S]*correct_count\s+desc[\s\S]*created_at/i);
  assert.doesNotMatch(sql,/dense_rank\(\)/i);
});

test('Arena week 3/4 normalization uses the same Rule 8 weekly order',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/create or replace function public\.league_historical_seed_scores\b/i);
  assert.match(sql,/row_number\(\) over\(partition by s\.season,s\.week order by s\.points desc,coalesce\(i\.invite_count,0\) desc,s\.exact_count desc,s\.correct_count desc,s\.created_at/i);
  assert.match(sql,/public\.league_normalized_performance\(r\.round_rank,r\.participant_count\)/i);
});

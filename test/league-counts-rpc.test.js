const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const file=path.join(__dirname,'../supabase/migrations/20260909200000_bizim_skor_league_memberships.sql');
const sql=()=>fs.readFileSync(file,'utf8');

test('UI için get_league_counts RPC tanımlıdır',()=>{
  const source=sql();
  assert.match(source,/create or replace function public\.get_league_counts\(\s*p_token text\s*\)/i);
  assert.match(source,/returns table\(\s*league_code text\s*,\s*player_count bigint\s*\)/i);
});

test('get_league_counts oturumu doğrular ve yalnız açık dönemi sayar',()=>{
  const source=sql();
  const fn=source.match(/create or replace function public\.get_league_counts[\s\S]*?\$\$;/i)?.[0]||'';
  assert.match(fn,/friend_session_player\(p_token\)/i);
  assert.match(fn,/where\s+lp\.status='open'/i);
  assert.match(fn,/group by\s+m\.league_code/i);
});

test('get_league_counts yalnız anon rolüne açılır',()=>{
  const source=sql();
  assert.match(source,/revoke execute on function public\.get_league_counts\(text\) from public,authenticated/i);
  assert.match(source,/grant execute on function public\.get_league_counts\(text\) to anon/i);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const path='supabase/migrations/20260924233000_arena_player_card_all_competitions.sql';

test('Arena oyuncu kartı oynanmış tüm organizasyon haftalarını kronolojik döndürür',()=>{
  assert.equal(fs.existsSync(path),true,'Arena kartı migration dosyası eksik');
  const sql=fs.readFileSync(path,'utf8');

  assert.match(sql,/public\.arena_accessible_rounds\(m\.period_id,m\.player_id\)/i);
  assert.match(sql,/left join public\.league_round_performance rp/is);
  assert.match(sql,/order by ar\.lock_time,ar\.competition,ar\.round_key/i);
  assert.doesNotMatch(sql,/rp\.competition\s*=\s*'super_lig'/i);
  assert.match(sql,/'competition',ar\.competition/i);
  assert.match(sql,/'performance_score',ar\.performance_score/i);
});

test('Arena kartı RPC erişimi doğrulanmış oyun oturumuyla sınırlı kalır',()=>{
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/public\.friend_session_player\(p_token\)/i);
  assert.match(sql,/set search_path=''/i);
  assert.match(sql,/revoke execute on function public\.get_arena_player_card\(text,text\) from public,authenticated/i);
  assert.match(sql,/grant execute on function public\.get_arena_player_card\(text,text\) to anon/i);
});

test('canlı Arena yenilemesi yapan kart RPC salt-okunur işlem olarak tanımlanmaz',()=>{
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/perform public\.refresh_current_arena_live\(\)/i);
  assert.match(sql,/language plpgsql\s+volatile\s+security definer/is);
  assert.doesNotMatch(sql,/language plpgsql\s+stable\s+security definer/is);
});

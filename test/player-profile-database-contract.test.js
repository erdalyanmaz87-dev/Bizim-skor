const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const path='supabase/migrations/20260907130000_player_profile.sql';

test('oyuncu profili yalnız doğrulanmış oturumla açılır',()=>{
  assert.equal(fs.existsSync(path),true,'player profile migration eksik');
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/create or replace function public\.get_player_public_profile\(p_token text,p_player_name text\)/i);
  assert.match(sql,/public\.friend_session_player\(p_token\)/i);
  assert.match(sql,/Oturum geçersiz veya süresi dolmuş/i);
  assert.match(sql,/revoke all on function public\.get_player_public_profile\(text,text\) from public/i);
  assert.match(sql,/grant execute on function public\.get_player_public_profile\(text,text\) to anon/i);
});

test('rakip tahmini maç başlamadan SQL katmanında gizlenir',()=>{
  assert.equal(fs.existsSync(path),true,'player profile migration eksik');
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/case\s+when\s+v_player=v_target\s+or\s+f\.kickoff<=now\(\)\s+then\s+p\.home_score::smallint\s+else\s+null::smallint\s+end/is);
  assert.match(sql,/case\s+when\s+v_player=v_target\s+or\s+f\.kickoff<=now\(\)\s+then\s+p\.away_score::smallint\s+else\s+null::smallint\s+end/is);
  assert.doesNotMatch(sql,/or\s+r\.fixture_id\s+is\s+not\s+null\s+then\s+p\.home_score/i);
});

test('profil güncel hafta ve üç genel durum sırasını döndürür',()=>{
  assert.equal(fs.existsSync(path),true,'player profile migration eksik');
  const sql=fs.readFileSync(path,'utf8');
  for(const field of ['week_rank','week_points','general_rank','sezu_rank','champions_rank','special_kind'])assert.match(sql,new RegExp(field,'i'));
});

test('Sezu kartı ancak dördüncü haftanın bütün maçları tamamlanınca kapanır',()=>{
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/not exists\s*\(\s*select 1\s+from public\.fixtures f\s+left join public\.results r/is);
  assert.match(sql,/f\.week=4\s+and\s+\(r\.fixture_id is null or r\.home_score is null or r\.away_score is null\)/is);
});

test('Sezu sıra hesabı mevcut ilk üç ve devam sırası kuralını kullanır',()=>{
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/sezu_point_ranked/is);
  assert.match(sql,/case when spr\.point_rank<=3 then spr\.point_rank else 3\+/is);
});

test('integer skor sütunları RPC smallint sözleşmesine açıkça çevrilir',()=>{
  const sql=fs.readFileSync(path,'utf8');
  assert.match(sql,/then p\.home_score::smallint else null::smallint end/is);
  assert.match(sql,/then p\.away_score::smallint else null::smallint end/is);
  assert.match(sql,/r\.home_score::smallint,r\.away_score::smallint/is);
});

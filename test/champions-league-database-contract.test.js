const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'../supabase/migrations/20260829120422_champions_league_competition.sql');

function sql(){return fs.readFileSync(file,'utf8')}

test('Şampiyonlar Ligi ayrı ve RLS korumalı tablolardadır',()=>{
  const source=sql();
  for(const table of ['champions_league_fixtures','champions_league_predictions','champions_league_results']){
    assert.match(source,new RegExp(`create table public\\.${table}`,'i'));
    assert.match(source,new RegExp(`alter table public\\.${table} enable row level security`,'i'));
    assert.match(source,new RegExp(`revoke all on table public\\.${table} from anon, authenticated`,'i'));
  }
  assert.doesNotMatch(source,/alter table public\.(fixtures|predictions|results)\b/i);
  assert.doesNotMatch(source,/(insert into|update|delete from) public\.(fixtures|predictions|results)\b/i);
});

test('güvenli RPC oturumu ve sunucu saatini doğrular',()=>{
  const source=sql();
  assert.match(source,/friend_session_player\(p_token\)/i);
  assert.match(source,/set search_path = ''/gi);
  assert.match(source,/now\(\)\s*>=\s*v_lock_time/i);
  assert.match(source,/jsonb_array_length\(p_predictions\)/i);
  assert.match(source,/between 0 and 20/i);
});

test('2026-27 ilk hafta fikstürünün 18 maçı eklenir',()=>{
  const source=sql();
  const fixtureSection=source.match(/insert into public\.champions_league_fixtures[\s\S]*?on conflict/i)?.[0]||'';
  assert.equal((fixtureSection.match(/\('2026\/27',\s*1,/g)||[]).length,18);
  assert.match(fixtureSection,/2026-09-08 16:45:00\+00/);
  assert.match(fixtureSection,/'Sporting CP',\s*'Galatasaray'/);
  assert.match(fixtureSection,/'Fenerbahçe',\s*'Roma'/);
});

test('yalnız token korumalı dört RPC anonim role açılır',()=>{
  const source=sql();
  for(const name of ['get_champions_league_week','save_champions_league_predictions','get_champions_league_ranking','get_champions_league_week_predictions']){
    assert.match(source,new RegExp(`revoke execute on function public\\.${name}`,'i'));
    assert.match(source,new RegExp(`grant execute on function public\\.${name}[\\s\\S]*? to anon`,'i'));
  }
});

test('sonuçlar girilmeden tahmin yapan oyuncu sıfır puanla sıralamada kalır',()=>{
  const source=sql();
  assert.match(source,/from public\.champions_league_predictions p[\s\S]*left join public\.champions_league_results r/);
  assert.match(source,/coalesce\(sum\(case/);
});

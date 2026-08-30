const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'..','supabase','migrations','20260830_live_score_automation.sql');
const hardeningFile=path.join(__dirname,'..','supabase','migrations','20260830203000_harden_live_score_discovery.sql');

test('canlı skor tabloları RLS ile korunur ve tarayıcıya açılmaz',()=>{
  const sql=fs.readFileSync(file,'utf8');
  for(const table of ['live_fixture_links','live_score_cache','live_score_daily_usage','live_score_result_audit']){
    assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`,'i'));
    assert.match(sql,new RegExp(`revoke all on public\\.${table} from anon, authenticated`,'i'));
  }
});

test('yalnız temizlenmiş canlı kart RPCsi anonim role açılır',()=>{
  const sql=fs.readFileSync(file,'utf8');
  assert.match(sql,/create or replace function public\.get_today_live_match_cards/i);
  assert.match(sql,/grant execute on function public\.get_today_live_match_cards\(timestamptz\) to anon/i);
  assert.match(sql,/revoke all on function public\.finalize_live_score_result/i);
  assert.match(sql,/revoke all on function public\.record_provider_observation/i);
});

test('tahmin isimleri yalnız maç başladıktan sonra ve aktif oyuncular için açılır',()=>{
  const sql=fs.readFileSync(file,'utf8');
  assert.match(sql,/p_now\s*>=\s*f\.kickoff/i);
  assert.match(sql,/pl\.is_active\s*=\s*true/i);
  assert.match(sql,/exact_players/i);
});

test('iki bitiş doğrulaması ve manuel ezmeme koruması vardır',()=>{
  const sql=fs.readFileSync(file,'utf8');
  assert.match(sql,/terminal_seen_count\s*<\s*2/i);
  assert.match(sql,/manual_override/i);
  assert.match(sql,/pg_advisory_xact_lock/i);
});

test('mevcut oyun tablolarının yapısını değiştirmez',()=>{
  const sql=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(sql,/alter table public\.(fixtures|predictions|results|players|friend_leagues|champions_league_fixtures|champions_league_predictions|champions_league_results)\b/i);
});

test('fikstür keşif yardımcısı tarayıcı rollerine kapalıdır',()=>{
  const sql=fs.readFileSync(hardeningFile,'utf8');
  assert.match(sql,/revoke all on function public\.record_live_score_discovery\(text,bigint,text,bigint\)\s+from public,\s*anon,\s*authenticated/i);
  assert.match(sql,/grant execute on function public\.record_live_score_discovery\(text,bigint,text,bigint\)\s+to service_role/i);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationPath=path.join(__dirname,'..','supabase','migrations','20260912233000_arena_live_weeks_5_8.sql');

test('Arena 5-8 haftalarını tamamlanmadan canlı işler ve ortalamayı bu haftalardan alır',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/f\.week between v_start_week and v_start_week\+3/i);
  assert.match(sql,/count\(distinct r\.fixture_id\).*?>\s*0/is);
  assert.match(sql,/refresh_arena_live_super_week\(/i);
  assert.match(sql,/perform public\.refresh_league_memberships\(v_period_id\)/i);
});

test('Arena canlı hafta sırası 8. maddeyi kullanır ve mevcut ligleri değiştirmez',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/points desc[\s\S]*invite_count[\s\S]*exact_count desc[\s\S]*correct_count desc[\s\S]*created_at/i);
  assert.match(sql,/on conflict\(period_id,player_id,competition,round_key\) do update/i);
  assert.doesNotMatch(sql,/set\s+league_code\s*=/i);
});

test('minimum iki hafta katılmayan oyuncu yükselmez ve düşme önceliğine girer',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/where m\.period_id=v_period_id and not m\.is_eligible/i);
  assert.match(sql,/case when m\.league_code='bronze' then 'none' else 'relegation' end/i);
});

test('ilk dönem 9. hafta fikstürü henüz yüklenmemiş olsa da 5. haftada açılır',()=>{
  const bootstrap=fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260912234500_arena_bootstrap_without_week_9.sql'),'utf8');
  assert.match(bootstrap,/coalesce\(v_end_at,v_start_at\+interval '35 days'\)/i);
  assert.match(bootstrap,/perform public\.initialize_first_league_period\(v_start_at,v_end_at\)/i);
  assert.match(bootstrap,/select public\.refresh_current_arena_live\(\)/i);
});

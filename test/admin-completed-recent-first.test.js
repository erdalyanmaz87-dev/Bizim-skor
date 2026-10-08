const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationPath=path.join(__dirname,'../supabase/migrations/20261008183000_admin_completed_recent_first.sql');

test('yönetici özetinde tahmin yapanlar son kaydedenden eskiye sıralanır',()=>{
  assert.equal(fs.existsSync(migrationPath),true);
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/jsonb_agg\([\s\S]*order by c\.completed_at desc nulls last/i);
  assert.match(sql,/jsonb_build_object\('completed_at',\s*c\.completed_at\)/i);
  assert.match(sql,/max\(pr\.created_at\) as completed_at/i);
  assert.match(sql,/f\.season\s*=\s*b\.j->>'season'/i);
  assert.match(sql,/f\.week\s*=\s*\(b\.j->>'week'\)::integer/i);
  assert.match(sql,/summary,total_registered/i);
  assert.match(sql,/revoke all on function public\.get_admin_statistics_dashboard\(text\)/i);
});

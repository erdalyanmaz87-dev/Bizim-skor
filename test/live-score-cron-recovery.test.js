const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationsDir=path.join(__dirname,'..','supabase','migrations');
const migrationName='20260831193000_restore_live_score_cron.sql';
const migrationPath=path.join(migrationsDir,migrationName);
const edgePath=path.join(__dirname,'..','supabase','functions','live-score-sync','index.ts');

test('canlı skor görevi her beş dakikada Edge Function çağırır',()=>{
  assert.equal(fs.existsSync(migrationPath),true,`${migrationName} eksik`);
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/cron\.schedule/i);
  assert.match(sql,/live-score-sync/i);
  assert.match(sql,/\*\/5\s+\*\s+\*\s+\*\s+\*/);
  assert.match(sql,/net\.http_post/i);
});

test('cron anahtarı Vault içinde tutulur ve yalnız servis rolü doğrular',()=>{
  assert.equal(fs.existsSync(migrationPath),true,`${migrationName} eksik`);
  const sql=fs.readFileSync(migrationPath,'utf8');
  const edge=fs.readFileSync(edgePath,'utf8');
  assert.match(sql,/vault\.create_secret/i);
  assert.match(sql,/authorize_live_score_cron/i);
  assert.match(sql,/revoke all on function public\.authorize_live_score_cron/i);
  assert.match(sql,/grant execute on function public\.authorize_live_score_cron[^;]+service_role/i);
  assert.match(edge,/authorize_live_score_cron/);
  assert.match(edge,/x-cron-secret/i);
});

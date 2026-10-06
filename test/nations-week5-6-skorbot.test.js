const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationPath=path.join(__dirname,'../supabase/migrations/20261006214000_nations_week5_6_robot_predictions.sql');

test('Uluslar Ligi 5 ve 6. hafta SkorBot önerileri gerçek öneri tablosuna yazılır',()=>{
  assert.equal(fs.existsSync(migrationPath),true);
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/insert into public\.robot_match_predictions/i);
  for(let fixtureId=9033;fixtureId<=9048;fixtureId++)assert.match(sql,new RegExp(`\\b${fixtureId}\\b`));
  assert.match(sql,/robot_model_v1/);
});

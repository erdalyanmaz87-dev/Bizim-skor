const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationPath=path.join(__dirname,'../supabase/migrations/20260928100000_nations_league_week3.sql');

test('Uluslar Ligi 3. hafta sekiz maçı doğru UTC saatleriyle ekler',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  const fixtures=[
    ['Almanya','Sırbistan','2026-10-01 18:45:00+00'],
    ['Yunanistan','Hollanda','2026-10-01 18:45:00+00'],
    ['Danimarka','Portekiz','2026-10-01 18:45:00+00'],
    ['Galler','Norveç','2026-10-01 18:45:00+00'],
    ['Belçika','Türkiye','2026-10-02 18:45:00+00'],
    ['Fransa','İtalya','2026-10-02 18:45:00+00'],
    ['Hırvatistan','İngiltere','2026-10-03 16:00:00+00'],
    ['İspanya','Çekya','2026-10-03 18:45:00+00']
  ];
  for(const [home,away,kickoff] of fixtures){
    assert.match(sql,new RegExp(`${home}.*${away}.*${kickoff.replace(/[+]/g,'\\+')}`,'s'));
  }
  assert.equal((sql.match(/'2026\/27',\s*3,/g)||[]).length,8);
});

test('3. hafta fırsat maçı Fransa - İtalya için X2 puan verir',()=>{
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/9022/);
  assert.match(sql,/then 8/);
  assert.match(sql,/then 2/);
});

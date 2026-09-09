const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationsDir=path.join(__dirname,'../supabase/migrations');

function leagueMigrationSources(){
  return fs.readdirSync(migrationsDir)
    .filter(name=>/bizim_skor_league/i.test(name))
    .map(name=>({name,source:fs.readFileSync(path.join(migrationsDir,name),'utf8')}));
}

function owners(regex){
  return leagueMigrationSources().filter(file=>regex.test(file.source)).map(file=>file.name);
}

test('get_league_counts yalnız tek migration tarafından tanımlanır',()=>{
  assert.deepEqual(owners(/create or replace function public\.get_league_counts/i),[
    '20260909200200_bizim_skor_league_counts_rpc.sql'
  ]);
});

test('close_league_period yalnız güncel inactivity migrationında tanımlanır',()=>{
  assert.deepEqual(owners(/create or replace function public\.close_league_period/i),[
    '20260909205000_bizim_skor_league_inactivity_relegation.sql'
  ]);
});

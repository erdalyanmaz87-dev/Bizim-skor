const assert=require('assert');
const data=require('./fixture-data.js');
const calls=[];
const sb={rpc:async(name,args)=>{calls.push([name,args]);return{data:[{fixture_id:9009,home_team:'Sırbistan',away_team:'Hollanda',week:2}],error:null}}};
(async()=>{
  const rows=await data.fetchNationsWeek(sb,'token-1','2026/27',2);
  assert.strictEqual(calls[0][0],'get_nations_league_week');
  assert.deepStrictEqual(calls[0][1],{p_token:'token-1',p_season:'2026/27',p_week:2});
  assert.strictEqual(rows[0].id,9009);
  const weeks=await data.fetchAvailableWeeks(sb,'token-1','2026/27','nations');
  assert.strictEqual(calls[1][0],'get_nations_league_available_weeks');
  assert.deepStrictEqual(weeks,[2]);
  console.log('fixture-data ok');
})().catch(error=>{console.error(error);process.exit(1)});

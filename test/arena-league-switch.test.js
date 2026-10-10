const test=require('node:test');
const assert=require('node:assert/strict');
const leagues=require('../league-system-ui');

test('every completed Arena league switch reapplies badges and logos to the new table',async()=>{
  const calls=[],handlers={};
  const doc={};
  const host={ownerDocument:doc,innerHTML:'',querySelector:()=>null,querySelectorAll:()=>['elite','gold','bronze'].map(code=>({dataset:{leagueCode:code},addEventListener:(event,fn)=>{handlers[code]=fn}}))};
  const previousRules=globalThis.BizimSkorArenaSeason1Rules,previousLogos=globalThis.BizimSkorSupportedTeamRankingLogos;
  globalThis.BizimSkorArenaSeason1Rules={correctRules:d=>assert.equal(d,doc),annotateRows:(rows,d,period)=>{assert.equal(d,doc);assert.equal(period,1);assert(host.innerHTML.includes(rows[0].player_name));calls.push(['badge',rows[0].league_code])}};
  globalThis.BizimSkorSupportedTeamRankingLogos={refresh:async d=>{assert.equal(d,doc);calls.push(['logo',host.innerHTML.includes('gold-player')?'gold':host.innerHTML.includes('bronze-player')?'bronze':'elite'])}};
  let resolveTable;
  const sb={rpc:async(name,args)=>{
    if(name==='get_my_league_summary')return{data:{period_no:1,league_code:'elite',valid_round_count:2,is_eligible:true}};
    if(name==='get_league_counts')return{data:[]};
    if(name==='get_league_table')return new Promise(resolve=>{resolveTable=()=>resolve({data:[{league_code:args.p_league_code,player_name:args.p_league_code+'-player',league_rank:1,valid_round_count:0}]})});
    throw new Error(name);
  }};
  try{
    const mounting=leagues.mount({sb,token:'test',summaryHost:{},detailHost:host});
    await new Promise(resolve=>setImmediate(resolve));resolveTable();await mounting;
    assert.deepEqual(calls,[['badge','elite'],['logo','elite']]);
    for(const code of ['gold','bronze','elite']){
      calls.length=0;const switching=handlers[code]();
      await new Promise(resolve=>setImmediate(resolve));
      assert.deepEqual(calls,[],'decorations must wait until the replacement table is ready');
      resolveTable();await switching;
      assert.deepEqual(calls,[['badge',code],['logo',code]]);
    }
  }finally{globalThis.BizimSkorArenaSeason1Rules=previousRules;globalThis.BizimSkorSupportedTeamRankingLogos=previousLogos}
});

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorRobotPrediction=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const formScore=values=>(Array.isArray(values)?values:[]).slice(0,5).reduce((total,value)=>total+(value==='W'?2:value==='D'?0:-1),0);
  const rankScore=rank=>Number.isInteger(Number(rank))?Math.max(0,21-Number(rank))/3:0;
  const numeric=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const recentGoalStats=team=>{const name=String(team?.name||'').trim();const rows=Array.isArray(team?.recent_matches)?team.recent_matches.slice(0,5):[];if(!rows.length)return null;let gf=0,ga=0;for(const m of rows){const home=String(m?.home_team||'').trim()===name;if(home){gf+=numeric(m?.home_score);ga+=numeric(m?.away_score)}else{gf+=numeric(m?.away_score);ga+=numeric(m?.home_score)}}return{goalsFor:gf,goalsAgainst:ga,matches:rows.length}};
  const goalProfile=team=>{const recent=recentGoalStats(team);const matches=Math.max(1,recent?.matches||5);return{forAvg:(recent?recent.goalsFor:numeric(team?.goalsFor))/matches,againstAvg:(recent?recent.goalsAgainst:numeric(team?.goalsAgainst))/matches,totalAvg:((recent?recent.goalsFor:numeric(team?.goalsFor))+(recent?recent.goalsAgainst:numeric(team?.goalsAgainst)))/matches}};
  const teamStrength=team=>rankScore(team?.rank)+formScore(team?.form);
  function suggest(snapshot){const home=snapshot?.home||{},away=snapshot?.away||{},homeGoals=goalProfile(home),awayGoals=goalProfile(away),gap=teamStrength(home)-teamStrength(away)+0.75,totalTempo=(homeGoals.totalAvg+awayGoals.totalAvg)/2;
    if(gap>=6)return{homeScore:3,awayScore:0};
    if(gap>=3)return{homeScore:2,awayScore:0};
    if(gap>=1.5)return{homeScore:2,awayScore:1};
    if(gap<=-6)return{homeScore:0,awayScore:3};
    if(gap<=-3)return{homeScore:0,awayScore:2};
    if(gap<=-1.5)return{homeScore:1,awayScore:2};
    if(totalTempo>=3.2)return{homeScore:2,awayScore:2};
    return{homeScore:1,awayScore:0}
  }
  function applyToEmpty(inputs,suggestions){return(inputs||[]).map(input=>{const suggestion=suggestions?.[input.fixtureId];if(!suggestion||String(input.home)!==''||String(input.away)!=='')return{...input};return{...input,home:String(suggestion.homeScore),away:String(suggestion.awayScore)}})}
  function robotLimit(totalFixtures){const total=Math.max(0,Number(totalFixtures)||0);return Math.floor(total*2/3)}
  function remainingRobotAllowance(totalFixtures,used){return Math.max(0,robotLimit(totalFixtures)-Math.max(0,Number(used)||0))}
  function pickRandomEmpty(inputs,limit,rng=Math.random){const empty=(inputs||[]).filter(input=>String(input.home??'')===''&&String(input.away??'')==='').slice();for(let i=empty.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[empty[i],empty[j]]=[empty[j],empty[i]]}return empty.slice(0,Math.max(0,Number(limit)||0))}
  return Object.freeze({teamStrength,suggest,applyToEmpty,robotLimit,remainingRobotAllowance,pickRandomEmpty});
});

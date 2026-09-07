(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorRobotPrediction=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const formScore=values=>(Array.isArray(values)?values:[]).slice(0,5).reduce((total,value)=>total+(value==='W'?2:value==='D'?0:-1),0);
  const rankScore=rank=>Number.isInteger(Number(rank))?Math.max(0,21-Number(rank))/3:0;
  const teamStrength=team=>rankScore(team?.rank)+formScore(team?.form);
  function suggest(snapshot){const gap=teamStrength(snapshot?.home)-teamStrength(snapshot?.away);if(gap>=4)return{homeScore:2,awayScore:0};if(gap>=2)return{homeScore:2,awayScore:1};if(gap<=-4)return{homeScore:0,awayScore:2};if(gap<=-2)return{homeScore:1,awayScore:2};return{homeScore:1,awayScore:1}}
  function applyToEmpty(inputs,suggestions){return(inputs||[]).map(input=>{const suggestion=suggestions?.[input.fixtureId];if(!suggestion||String(input.home)!==''||String(input.away)!=='')return{...input};return{...input,home:String(suggestion.homeScore),away:String(suggestion.awayScore)}})}
  function robotLimit(totalFixtures){const total=Math.max(0,Number(totalFixtures)||0);return Math.floor(total*2/3)}
  function remainingRobotAllowance(totalFixtures,used){return Math.max(0,robotLimit(totalFixtures)-Math.max(0,Number(used)||0))}
  function pickRandomEmpty(inputs,limit,rng=Math.random){const empty=(inputs||[]).filter(input=>String(input.home??'')===''&&String(input.away??'')==='').slice();for(let i=empty.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[empty[i],empty[j]]=[empty[j],empty[i]]}return empty.slice(0,Math.max(0,Number(limit)||0))}
  return Object.freeze({teamStrength,suggest,applyToEmpty,robotLimit,remainingRobotAllowance,pickRandomEmpty});
});

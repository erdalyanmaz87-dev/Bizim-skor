(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorRobotPrediction=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const formScore=values=>(Array.isArray(values)?values:[]).slice(0,5).reduce((total,value)=>total+(value==='W'?2:value==='D'?0:-1),0);
  const rankScore=rank=>Number.isInteger(Number(rank))?Math.max(0,21-Number(rank))/3:0;
  const teamStrength=team=>rankScore(team?.rank)+formScore(team?.form);
  function suggest(snapshot){const gap=teamStrength(snapshot?.home)-teamStrength(snapshot?.away);if(gap>=4)return{homeScore:2,awayScore:0};if(gap>=2)return{homeScore:2,awayScore:1};if(gap<=-4)return{homeScore:0,awayScore:2};if(gap<=-2)return{homeScore:1,awayScore:2};return{homeScore:1,awayScore:1}}
  function applyToEmpty(inputs,suggestions){return(inputs||[]).map(input=>{const suggestion=suggestions?.[input.fixtureId];if(!suggestion||String(input.home)!==''||String(input.away)!=='')return{...input};return{...input,home:String(suggestion.homeScore),away:String(suggestion.awayScore)}})}
  function robotLimit(competition){return competition==='champions_league'?12:6}
  return Object.freeze({teamStrength,suggest,applyToEmpty,robotLimit});
});

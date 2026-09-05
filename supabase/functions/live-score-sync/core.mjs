const TERMINAL=new Set(['FT','AET','PEN']);

function validScore(value){return Number.isInteger(value)&&value>=0&&value<=20}

export function normalizeApiFootballFixture(raw){
  const provider_fixture_id=raw?.fixture?.id;
  const status=String(raw?.fixture?.status?.short||'');
  const elapsed=raw?.fixture?.status?.elapsed??null;
  const home_score=raw?.goals?.home;
  const away_score=raw?.goals?.away;
  if(!Number.isInteger(provider_fixture_id)||!status||!validScore(home_score)||!validScore(away_score))throw new Error('Geçersiz sağlayıcı skoru');
  return{provider_fixture_id,status,elapsed,home_score,away_score};
}

export function nextTerminalState(previous,observation){
  const terminal=TERMINAL.has(String(observation?.status||''));
  if(!terminal||!validScore(observation?.home_score)||!validScore(observation?.away_score))return{terminal_seen_count:0,terminal_signature:null,should_finalize:false};
  const terminal_signature=`${observation.status}:${observation.home_score}:${observation.away_score}`;
  const terminal_seen_count=previous?.terminal_signature===terminal_signature?Number(previous.terminal_seen_count||0)+1:1;
  return{terminal_seen_count,terminal_signature,should_finalize:terminal_seen_count>=2};
}

export function shouldPoll({active_fixture_count,request_count,last_requested_at,reserved_requests=5,daily_limit=100,now=new Date()}){
  if(Number(active_fixture_count)<1||Number(request_count)>=Number(daily_limit)-Number(reserved_requests))return false;
  if(!last_requested_at)return true;
  return new Date(now).getTime()-new Date(last_requested_at).getTime()>=300000;
}

export function adaptivePollIntervalMinutes({request_count,remaining_window_minutes,reserved_requests=6,daily_limit=100}){
  const available=Math.floor(Number(daily_limit)-Number(reserved_requests)-Number(request_count));
  if(!Number.isFinite(available)||available<1)return null;
  const remaining=Math.max(1,Math.ceil(Number(remaining_window_minutes)||0));
  return Math.max(1,Math.min(15,Math.ceil(remaining/available)));
}

export function shouldAdaptivePoll({active_fixture_count,request_count,remaining_window_minutes,last_requested_at,now=new Date()}){
  if(Number(active_fixture_count)<1)return false;
  const interval=adaptivePollIntervalMinutes({request_count,remaining_window_minutes});
  if(interval===null)return false;
  if(!last_requested_at)return true;
  return new Date(now).getTime()-new Date(last_requested_at).getTime()>=interval*60000;
}

export function isPollableFixture({cache_status,result_finalized}){
  if(result_finalized===true)return false;
  return !TERMINAL.has(String(cache_status||''));
}

function teamKey(value){
  const key=String(value||'').toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  return ({erzurumsporfk:'erzurumbb'})[key]||key;
}

function sameTeam(left,right){
  const a=teamKey(left),b=teamKey(right),shorter=a.length<=b.length?a:b,longer=a.length<=b.length?b:a;
  return !!shorter&&(a===b||(shorter.length>=5&&longer.includes(shorter)));
}

export function matchScheduledProviderFixture(internal,candidates){
  const kickoff=new Date(internal?.kickoff).getTime();
  if(!Number.isFinite(kickoff))return null;
  const matches=(Array.isArray(candidates)?candidates:[]).filter(raw=>{
    const providerId=Number(raw?.fixture?.id),providerKickoff=new Date(raw?.fixture?.date).getTime();
    return Number.isInteger(providerId)&&Number.isFinite(providerKickoff)&&Math.abs(providerKickoff-kickoff)<=30*60*1000&&
      sameTeam(internal?.home_team,raw?.teams?.home?.name)&&sameTeam(internal?.away_team,raw?.teams?.away?.name);
  });
  return matches.length===1?matches[0]:null;
}

export function matchUnlinkedLiveFixtures(internalFixtures,providerFixtures){
  const available=[...(Array.isArray(providerFixtures)?providerFixtures:[])];
  const matches=[];
  for(const fixture of Array.isArray(internalFixtures)?internalFixtures:[]){
    const match=matchScheduledProviderFixture(fixture,available);
    if(!match)continue;
    const providerFixtureId=Number(match?.fixture?.id);
    matches.push({competition:String(fixture.competition),fixture_id:Number(fixture.id),provider_fixture_id:providerFixtureId});
    const index=available.findIndex(row=>Number(row?.fixture?.id)===providerFixtureId);
    if(index>=0)available.splice(index,1);
  }
  return matches;
}

export function extractProviderTeamNames(rows){
  const unique=new Map();
  for(const row of Array.isArray(rows)?rows:[]){
    const id=Number(row?.team?.id),name=String(row?.team?.name||'').trim();
    if(Number.isInteger(id)&&id>0&&name&&!unique.has(id))unique.set(id,{id,name});
  }
  return [...unique.values()].sort((a,b)=>a.name.localeCompare(b.name,'tr'));
}

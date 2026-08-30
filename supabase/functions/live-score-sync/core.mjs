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

export function shouldPoll({active_fixture_count,request_count,last_requested_at,now=new Date()}){
  if(Number(active_fixture_count)<1||Number(request_count)>=95)return false;
  if(!last_requested_at)return true;
  return new Date(now).getTime()-new Date(last_requested_at).getTime()>=300000;
}

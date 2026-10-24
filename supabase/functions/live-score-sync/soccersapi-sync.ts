import {matchSoccersFixtures,normalizeSoccersFixture,soccersPollQuota,needsPreflight} from './soccersapi.mjs';
import {resolvePollIntervalMinutes,shouldAdaptivePoll} from './core.mjs';

const COMPETITIONS=[['super_lig','fixtures','results'],['champions_league','champions_league_fixtures','champions_league_results'],['nations_league','nations_league_fixtures','nations_league_results']];
export async function syncSoccersApi(sb:any,token:string,body:any,options:{autoFinalize:boolean,now?:Date}){
 const preview=body?.preview===true,now=options.now||new Date();
 const gateResponse=await sb.rpc('get_soccersapi_poll_gate');
 if(gateResponse.error)throw gateResponse.error;
 const gate=gateResponse.data?.[0]||{},quota=soccersPollQuota(gate,now),interval=resolvePollIntervalMinutes(quota);
 const active=Number(gate.active_fixture_count||0)>0;
 const liveDue=active&&shouldAdaptivePoll({...quota,active_fixture_count:gate.active_fixture_count,last_requested_at:gate.last_observation_at,scheduling_tolerance_ms:15000});
 if(!preview&&active&&!liveDue)return {provider:'soccersapi',polled:false,reason:interval==null?'daily_quota_guard':'throttled',poll_interval_minutes:interval};
 const start=new Date(now.getTime()-4*3600000).toISOString(),end=new Date(now.getTime()+24*3600000).toISOString();
 const [linkQ,logQ]=await Promise.all([sb.from('live_fixture_links').select('competition,fixture_id,provider_fixture_id,provider,enabled'),sb.from('live_score_discovery_log').select('competition,fixture_id,attempted_at,status')]);
 if(linkQ.error||logQ.error)throw(linkQ.error||logQ.error);
 const key=(f:any)=>`${f.competition}:${f.id??f.fixture_id}`;
 const links=new Map((linkQ.data||[]).map((x:any)=>[key(x),x])),logs=new Map((logQ.data||[]).map((x:any)=>[key(x),x]));
 const fixtures:any[]=[];
 for(const [competition,table,resultTable] of COMPETITIONS){
  const found=await sb.from(table).select('id,home_team,away_team,kickoff').gte('kickoff',start).lte('kickoff',end);
  if(found.error)throw found.error;
  if(!found.data?.length)continue;
  const results=await sb.from(resultTable).select('fixture_id,home_score,away_score').in('fixture_id',found.data.map((r:any)=>r.id));
  if(results.error)throw results.error;
  const finished=new Set((results.data||[]).filter((r:any)=>r.home_score!=null&&r.away_score!=null).map((r:any)=>Number(r.fixture_id)));
  fixtures.push(...found.data.filter((r:any)=>!finished.has(Number(r.id))).map((r:any)=>({...r,competition})));
 }
 const due=fixtures.filter(f=>needsPreflight(f,logs.get(key(f)),links.get(key(f)),now));
 const candidates=fixtures.filter(f=>preview||((links.get(key(f)) as any)?.enabled!==false&&(Date.parse(f.kickoff)<=now.getTime()||due.includes(f))));
 if(!preview&&!liveDue&&!due.length)return {provider:'soccersapi',polled:false,reason:'no_active_fixture'};
 if(!candidates.length)return {provider:'soccersapi',polled:false,reason:'no_pending_fixture'};
 const localDate=now.toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
 const feedFor=(f:any)=>{const date=new Date(f.kickoff).toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});return date===localDate?'today':Date.parse(f.kickoff)>now.getTime()?'tomorrow':'yesterday'};
 const feeds=new Set(candidates.map(feedFor)),rows:any[]=[];
 let requestsLeft:number|null=null;
 for(const feed of feeds){
  for(let page=1;page<=3;page++){
   const reserved=await sb.rpc('reserve_soccersapi_request',{p_date:localDate});
   if(reserved.error)throw reserved.error;
   if(reserved.data!==true)return {provider:'soccersapi',polled:false,reason:'daily_quota_guard'};
   const response=await fetch(`https://api.soccersapi.com/v2.2/livescores/?t=${feed}&utc=3&page=${page}`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw new Error('soccersapi_http_'+response.status);
   const payload=await response.json();
   if(!Array.isArray(payload.data))throw new Error('soccersapi_invalid_payload');
   requestsLeft=payload.meta?.requests_left==null?null:Number(payload.meta.requests_left);
   if(Number.isFinite(requestsLeft)){
    const usage=await sb.from('soccersapi_daily_usage').update({remaining:Math.max(0,requestsLeft)}).eq('usage_date',localDate);
    if(usage.error)throw usage.error;
   }
   rows.push(...payload.data);
   if(page>=Number(payload.meta?.pages||1))break;
   if(requestsLeft!=null&&requestsLeft<=6)throw new Error('soccersapi_incomplete_feed_quota');
   if(page===3)throw new Error('soccersapi_pagination_limit');
  }
 }
 const matches=matchSoccersFixtures(candidates,rows,linkQ.data||[]),matchedKeys=new Set(matches.map(({internal:f}:any)=>key(f)));
 const missing=candidates.filter(f=>!matchedKeys.has(key(f)));
 const details=matches.map(({internal:f,raw:r}:any)=>({competition:f.competition,fixture_id:f.id,provider_fixture_id:Number(r.id),home:f.home_team,away:f.away_team,status:r.status_name}));
 const unmatched=missing.map(f=>({competition:f.competition,fixture_id:f.id,home:f.home_team,away:f.away_team,kickoff:f.kickoff}));
 if(preview)return {provider:'soccersapi',preview:true,matched:matches.length,candidates:candidates.length,matches:details,unmatched,provider_candidates:rows.map(r=>({id:r.id,league:r.league?.id,home:r.teams?.home?.name,away:r.teams?.away?.name,time:r.time})),requests_left:requestsLeft};
 for(const f of missing){const q=await sb.rpc('record_live_score_discovery',{p_competition:f.competition,p_fixture_id:f.id,p_status:'not_matched',p_provider_fixture_id:null});if(q.error)throw q.error;}
 let updated=0,finalized=0,linked=0;
 for(const {internal:f,raw:r} of matches){
  // A manual override may have arrived while the provider request was in flight.
  const latest=await sb.from('live_fixture_links').select('enabled').eq('competition',f.competition).eq('fixture_id',f.id).maybeSingle();
  if(latest.error)throw latest.error;
  if(latest.data?.enabled===false)continue;
  const link=await sb.from('live_fixture_links').upsert({competition:f.competition,fixture_id:f.id,provider_fixture_id:Number(r.id),provider:'soccersapi',enabled:true},{onConflict:'competition,fixture_id'});
  if(link.error)throw link.error;
  linked++;
  const discovery=await sb.rpc('record_live_score_discovery',{p_competition:f.competition,p_fixture_id:f.id,p_status:'matched',p_provider_fixture_id:Number(r.id)});
  if(discovery.error)throw discovery.error;
  if(Date.parse(f.kickoff)>now.getTime())continue;
  const observation=normalizeSoccersFixture(r);
  if(!observation)continue;
  const recorded=await sb.rpc('record_provider_observation',{p_competition:f.competition,p_fixture_id:f.id,p_status:observation.status,p_elapsed:observation.elapsed,p_home_score:observation.home_score,p_away_score:observation.away_score});
  if(recorded.error)throw recorded.error;
  updated++;
  if(recorded.data?.[0]?.should_finalize===true&&options.autoFinalize){const done=await sb.rpc('finalize_live_score_result',{p_competition:f.competition,p_fixture_id:f.id});if(done.error)throw done.error;if(done.data===true)finalized++;}
 }
 return {provider:'soccersapi',polled:true,preflight:!liveDue,matched:matches.length,linked,updated,finalized,unmatched,requests_left:requestsLeft,poll_interval_minutes:interval};
}

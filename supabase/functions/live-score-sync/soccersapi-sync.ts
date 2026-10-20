import {matchSoccersFixtures,normalizeSoccersFixture,soccersPollQuota} from './soccersapi.mjs';
import {resolvePollIntervalMinutes,shouldAdaptivePoll} from './core.mjs';

const COMPETITIONS=[['super_lig','fixtures','results'],['champions_league','champions_league_fixtures','champions_league_results'],['nations_league','nations_league_fixtures','nations_league_results']];
export async function syncSoccersApi(sb:any,token:string,body:any,options:{autoFinalize:boolean}){
 const preview=body?.preview===true;
 const day=preview&&body?.day==='tomorrow'?'tomorrow':'today';
 const now=new Date();
 const gateResponse=await sb.rpc('get_soccersapi_poll_gate');
 if(gateResponse.error)throw gateResponse.error;
 const gate=gateResponse.data?.[0]||{};
 const quota=soccersPollQuota(gate,now);
 const interval=resolvePollIntervalMinutes(quota);
 if(!preview){
  if(Number(gate.active_fixture_count||0)===0)return {provider:'soccersapi',polled:false,reason:'no_active_fixture'};
  if(!shouldAdaptivePoll({...quota,active_fixture_count:gate.active_fixture_count,last_requested_at:gate.last_observation_at,scheduling_tolerance_ms:15000}))return {provider:'soccersapi',polled:false,reason:interval==null?'daily_quota_guard':'throttled',poll_interval_minutes:interval};
 }
 const start=new Date(now.getTime()-4*3600000).toISOString();
 const end=new Date(now.getTime()+(preview?30:0)*3600000).toISOString();
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
 if(!fixtures.length)return {provider:'soccersapi',polled:false,reason:'no_pending_fixture'};
 const rows:any[]=[];
 let requestsLeft:number|null=null;
 // utc=3 keeps today's feed aligned with the game's Istanbul matchday.
 const days=new Set([day]);
 const localDate=now.toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
 if(!preview&&fixtures.some(f=>new Date(f.kickoff).toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'})!==localDate))days.add('yesterday');
 for(const feed of days){
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
   if(requestsLeft!=null&&requestsLeft<=6)break;
   if(page>=Number(payload.meta?.pages||1))break;
   if(page===3)throw new Error('soccersapi_pagination_limit');
  }
 }
 const matches=matchSoccersFixtures(fixtures,rows);
 const details=matches.map(({internal:f,raw:r}:any)=>({competition:f.competition,fixture_id:f.id,provider_fixture_id:Number(r.id),home:f.home_team,away:f.away_team,status:r.status_name}));
 if(preview)return {provider:'soccersapi',preview:true,matched:matches.length,candidates:fixtures.length,matches:details,requests_left:requestsLeft};
 let updated=0,finalized=0;
 for(const {internal:f,raw:r} of matches){
  const observation=normalizeSoccersFixture(r);
  if(!observation)continue;
  const linked=await sb.from('live_fixture_links').upsert({competition:f.competition,fixture_id:f.id,provider_fixture_id:Number(r.id),provider:'soccersapi',enabled:true},{onConflict:'competition,fixture_id'});
  if(linked.error)throw linked.error;
  const recorded=await sb.rpc('record_provider_observation',{p_competition:f.competition,p_fixture_id:f.id,p_status:observation.status,p_elapsed:observation.elapsed,p_home_score:observation.home_score,p_away_score:observation.away_score});
  if(recorded.error)throw recorded.error;
  updated++;
  if(recorded.data?.[0]?.should_finalize===true&&options.autoFinalize){
   const done=await sb.rpc('finalize_live_score_result',{p_competition:f.competition,p_fixture_id:f.id});
   if(done.error)throw done.error;
   if(done.data===true)finalized++;
  }
 }
 return {provider:'soccersapi',polled:true,matched:matches.length,updated,finalized,requests_left:requestsLeft,poll_interval_minutes:interval};
}

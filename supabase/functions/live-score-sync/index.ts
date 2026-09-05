import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {normalizeApiFootballFixture,matchScheduledProviderFixture,matchUnlinkedLiveFixtures,extractProviderTeamNames,adaptivePollIntervalMinutes,shouldAdaptivePoll} from './core.mjs';

const API_BASE='https://v3.football.api-sports.io';
const API_URL=`${API_BASE}/fixtures?live=all`;
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

function istanbulDayRange(now=new Date()){
  const date=now.toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
  const start=new Date(`${date}T00:00:00+03:00`);
  return{start:start.toISOString(),end:new Date(start.getTime()+24*60*60*1000).toISOString()};
}

function inLiveWindow(fixture:any,now=Date.now()){
  const kickoff=new Date(fixture?.kickoff).getTime();
  return Number.isFinite(kickoff)&&now>=kickoff&&now<kickoff+2*60*60*1000;
}

function equalSecret(left:string|null,right:string){
  if(!left||!right||left.length!==right.length)return false;
  let diff=0;
  for(let i=0;i<left.length;i++)diff|=left.charCodeAt(i)^right.charCodeAt(i);
  return diff===0;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json(405,{error:'method_not_allowed'});
  const apiKey=Deno.env.get('API_FOOTBALL_KEY')||'';
  const url=Deno.env.get('SUPABASE_URL')||'';
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!apiKey||!url||!serviceKey)return json(503,{error:'not_configured'});

  const sb=createClient(url,serviceKey,{auth:{persistSession:false}});
  try{
    const suppliedSecret=req.headers.get('x-cron-secret');
    const legacySecret=Deno.env.get('LIVE_SCORE_CRON_SECRET')||'';
    let authorized=equalSecret(suppliedSecret,legacySecret);
    if(!authorized&&suppliedSecret){
      const authResult=await sb.rpc('authorize_live_score_cron',{p_secret:suppliedSecret});
      authorized=authResult.error==null&&authResult.data===true;
    }
    if(!authorized)return json(401,{error:'unauthorized'});

    let body:any={};
    try{body=await req.json()}catch{}
    const inspectProviderFixtureIds=Array.isArray(body?.inspect_provider_fixture_ids)
      ? body.inspect_provider_fixture_ids.map(Number).filter((id:number)=>Number.isInteger(id)&&id>0).slice(0,20)
      : [];
    if(inspectProviderFixtureIds.length>0){
      const date=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
      const reserved=await sb.rpc('reserve_api_football_requests',{p_purpose:'live_score',p_count:1,p_date:date});
      if(reserved.error)throw reserved.error;
      const allowed=reserved.data?.reserved??reserved.data?.[0]?.reserved;
      if(allowed!==true)return json(200,{fixtures:[],reason:'daily_quota_guard'});
      const providerResponse=await fetch(`${API_BASE}/fixtures?ids=${inspectProviderFixtureIds.join('-')}`,{headers:{'x-apisports-key':apiKey}});
      if(!providerResponse.ok)throw new Error(`provider_${providerResponse.status}`);
      const payload=await providerResponse.json();
      return json(200,{fixtures:(payload?.response||[]).map((raw:any)=>({
        id:raw?.fixture?.id,date:raw?.fixture?.date,status:raw?.fixture?.status?.short,
        league_id:raw?.league?.id,season:raw?.league?.season,round:raw?.league?.round,
        home:{id:raw?.teams?.home?.id,name:raw?.teams?.home?.name},away:{id:raw?.teams?.away?.id,name:raw?.teams?.away?.name}
      }))});
    }
    const providerTeamSearch=String(body?.provider_team_search||'').trim();
    if(providerTeamSearch.length>=3&&providerTeamSearch.length<=40){
      const date=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
      const reserved=await sb.rpc('reserve_api_football_requests',{p_purpose:'live_score',p_count:1,p_date:date});
      if(reserved.error)throw reserved.error;
      const allowed=reserved.data?.reserved??reserved.data?.[0]?.reserved;
      if(allowed!==true)return json(200,{teams:[],reason:'daily_quota_guard'});
      const providerResponse=await fetch(`${API_BASE}/teams?search=${encodeURIComponent(providerTeamSearch)}`,{headers:{'x-apisports-key':apiKey}});
      if(!providerResponse.ok)throw new Error(`provider_${providerResponse.status}`);
      const payload=await providerResponse.json();
      return json(200,{teams:extractProviderTeamNames(payload?.response||[])});
    }
    const inspectProviderFixtureId=Number(body?.inspect_provider_fixture_id);
    if(Number.isInteger(inspectProviderFixtureId)&&inspectProviderFixtureId>0){
      const date=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
      const reserved=await sb.rpc('reserve_api_football_requests',{p_purpose:'live_score',p_count:1,p_date:date});
      if(reserved.error)throw reserved.error;
      const allowed=reserved.data?.reserved??reserved.data?.[0]?.reserved;
      if(allowed!==true)return json(200,{fixtures:[],reason:'daily_quota_guard'});
      const providerResponse=await fetch(`${API_BASE}/fixtures?id=${inspectProviderFixtureId}`,{headers:{'x-apisports-key':apiKey}});
      if(!providerResponse.ok)throw new Error(`provider_${providerResponse.status}`);
      const payload=await providerResponse.json();
      return json(200,{fixtures:(payload?.response||[]).map((raw:any)=>({
        id:raw?.fixture?.id,date:raw?.fixture?.date,
        league_id:raw?.league?.id,league_name:raw?.league?.name,season:raw?.league?.season,round:raw?.league?.round,
        home:{id:raw?.teams?.home?.id,name:raw?.teams?.home?.name},away:{id:raw?.teams?.away?.id,name:raw?.teams?.away?.name}
      }))});
    }
    if(body?.list_provider_teams===true){
      const date=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
      const reserved=await sb.rpc('reserve_api_football_requests',{p_purpose:'live_score',p_count:1,p_date:date});
      if(reserved.error)throw reserved.error;
      const allowed=reserved.data?.reserved??reserved.data?.[0]?.reserved;
      if(allowed!==true)return json(200,{teams:[],reason:'daily_quota_guard'});
      const providerResponse=await fetch(`${API_BASE}/teams?league=203&season=2026`,{headers:{'x-apisports-key':apiKey}});
      if(!providerResponse.ok)throw new Error(`provider_${providerResponse.status}`);
      const payload=await providerResponse.json();
      return json(200,{teams:extractProviderTeamNames(payload?.response||[])});
    }
    const discoverFixtureId=Number(body?.discover_fixture_id);
    if(Number.isInteger(discoverFixtureId)&&discoverFixtureId>0){
      const fixtureResult=await sb.from('fixtures').select('id,week,home_team,away_team,kickoff').eq('id',discoverFixtureId).maybeSingle();
      if(fixtureResult.error)throw fixtureResult.error;
      if(!fixtureResult.data)return json(404,{error:'fixture_not_found'});
      const existing=await sb.from('live_fixture_links').select('provider_fixture_id').eq('competition','super_lig').eq('fixture_id',discoverFixtureId).maybeSingle();
      if(existing.error)throw existing.error;
      if(existing.data)return json(200,{linked:true,fixture_id:discoverFixtureId,provider_fixture_id:existing.data.provider_fixture_id,existing:true});
      const date=new Date(fixtureResult.data.kickoff).toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
      const reserved=await sb.rpc('reserve_api_football_requests',{p_purpose:'live_score',p_count:1,p_date:date});
      if(reserved.error)throw reserved.error;
      const allowed=reserved.data?.reserved??reserved.data?.[0]?.reserved;
      if(allowed!==true)return json(200,{linked:false,reason:'daily_quota_guard'});
      const round=`Regular Season - ${Number(fixtureResult.data.week)}`;
      const providerHomeTeamId=Number(body?.provider_home_team_id);
      const providerAwayTeamId=Number(body?.provider_away_team_id);
      const providerQuery=Number.isInteger(providerHomeTeamId)&&providerHomeTeamId>0&&Number.isInteger(providerAwayTeamId)&&providerAwayTeamId>0
        ? `h2h=${providerHomeTeamId}-${providerAwayTeamId}`
        : Number.isInteger(providerHomeTeamId)&&providerHomeTeamId>0
        ? `team=${providerHomeTeamId}&next=20`
        : `league=203&season=2026&round=${encodeURIComponent(round)}`;
      const providerResponse=await fetch(`${API_BASE}/fixtures?${providerQuery}`,{headers:{'x-apisports-key':apiKey}});
      if(!providerResponse.ok)throw new Error(`provider_${providerResponse.status}`);
      const payload=await providerResponse.json();
      const match=matchScheduledProviderFixture(fixtureResult.data,payload?.response||[]);
      if(!match)return json(404,{linked:false,error:'provider_fixture_not_matched',candidates:(payload?.response||[]).slice(0,20).map((raw:any)=>({id:raw?.fixture?.id,date:raw?.fixture?.date,home:raw?.teams?.home?.name,away:raw?.teams?.away?.name}))});
      const providerFixtureId=Number(match.fixture.id);
      const linked=await sb.from('live_fixture_links').upsert({competition:'super_lig',fixture_id:discoverFixtureId,provider_fixture_id:providerFixtureId,enabled:true},{onConflict:'competition,fixture_id'});
      if(linked.error)throw linked.error;
      return json(200,{linked:true,fixture_id:discoverFixtureId,provider_fixture_id:providerFixtureId,existing:false});
    }

    const gateResult=await sb.rpc('get_live_score_adaptive_poll_gate');
    if(gateResult.error)throw gateResult.error;
    const gate=gateResult.data?.[0]||{};
    const active_fixture_count=Number(gate.active_fixture_count||0);
    const request_count=Number(gate.request_count||0);
    const remaining_window_minutes=Number(gate.remaining_window_minutes||0);
    const poll_interval_minutes=adaptivePollIntervalMinutes({request_count,remaining_window_minutes});
    if(active_fixture_count===0)return json(200,{polled:false,reason:'no_active_fixture'});
    if(poll_interval_minutes===null)return json(200,{polled:false,reason:'daily_quota_guard'});
    if(!shouldAdaptivePoll({active_fixture_count,request_count,remaining_window_minutes,last_requested_at:gate.last_observation_at}))
      return json(200,{polled:false,reason:'throttled',poll_interval_minutes});

    const counted=await sb.rpc('reserve_api_football_requests',{p_purpose:'live_score',p_count:1,p_date:new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'})});
    if(counted.error)throw counted.error;
    const reserved=counted.data?.reserved??counted.data?.[0]?.reserved;
    if(reserved!==true)return json(200,{polled:false,reason:'daily_quota_guard'});
    const providerResponse=await fetch(API_URL,{headers:{'x-apisports-key':apiKey}});
    if(!providerResponse.ok)throw new Error(`provider_${providerResponse.status}`);
    const payload=await providerResponse.json();
    const linksResult=await sb.from('live_fixture_links').select('competition,fixture_id,provider_fixture_id').eq('enabled',true);
    if(linksResult.error)throw linksResult.error;
    const links=new Map((linksResult.data||[]).map((row:any)=>[Number(row.provider_fixture_id),row]));
    const internalLinkKeys=new Set((linksResult.data||[]).map((row:any)=>`${row.competition}:${row.fixture_id}`));
    const range=istanbulDayRange();
    const [superResult,championsResult]=await Promise.all([
      sb.from('fixtures').select('id,home_team,away_team,kickoff').gte('kickoff',range.start).lt('kickoff',range.end),
      sb.from('champions_league_fixtures').select('id,home_team,away_team,kickoff').gte('kickoff',range.start).lt('kickoff',range.end)
    ]);
    if(superResult.error||championsResult.error)throw(superResult.error||championsResult.error);
    const now=Date.now();
    const unlinked=[
      ...(superResult.data||[]).map((row:any)=>({...row,competition:'super_lig'})),
      ...(championsResult.data||[]).map((row:any)=>({...row,competition:'champions_league'}))
    ].filter((row:any)=>inLiveWindow(row,now)&&!internalLinkKeys.has(`${row.competition}:${row.id}`));
    const unusedProviderRows=(payload?.response||[]).filter((raw:any)=>!links.has(Number(raw?.fixture?.id)));
    const discovered=matchUnlinkedLiveFixtures(unlinked,unusedProviderRows);
    if(discovered.length){
      const linked=await sb.from('live_fixture_links').upsert(
        discovered.map((row:any)=>({...row,enabled:true})),
        {onConflict:'competition,fixture_id'}
      );
      if(linked.error)throw linked.error;
      for(const row of discovered)links.set(Number(row.provider_fixture_id),row);
    }
    let updated=0,finalized=0;
    for(const raw of payload?.response||[]){
      let observation;
      try{observation=normalizeApiFootballFixture(raw)}catch{continue}
      const link:any=links.get(observation.provider_fixture_id);
      if(!link)continue;
      const recorded=await sb.rpc('record_provider_observation',{
        p_competition:link.competition,p_fixture_id:link.fixture_id,p_status:observation.status,
        p_elapsed:observation.elapsed,p_home_score:observation.home_score,p_away_score:observation.away_score
      });
      if(recorded.error)throw recorded.error;
      updated++;
      const shouldFinalize=recorded.data?.[0]?.should_finalize===true;
      if(shouldFinalize&&Deno.env.get('AUTO_FINALIZE_RESULTS')!=='false'){
        const done=await sb.rpc('finalize_live_score_result',{p_competition:link.competition,p_fixture_id:link.fixture_id});
        if(done.error)throw done.error;
        if(done.data===true)finalized++;
      }
    }
    return json(200,{polled:true,linked:discovered.length,updated,finalized,poll_interval_minutes});
  }catch{
    return json(502,{error:'live_score_sync_failed'});
  }
});

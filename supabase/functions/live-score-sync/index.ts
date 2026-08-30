import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {normalizeApiFootballFixture} from './core.mjs';

const API_URL='https://v3.football.api-sports.io/fixtures?live=all';
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

function equalSecret(left:string|null,right:string){
  if(!left||!right||left.length!==right.length)return false;
  let diff=0;
  for(let i=0;i<left.length;i++)diff|=left.charCodeAt(i)^right.charCodeAt(i);
  return diff===0;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json(405,{error:'method_not_allowed'});
  const cronSecret=Deno.env.get('LIVE_SCORE_CRON_SECRET')||'';
  if(!equalSecret(req.headers.get('x-cron-secret'),cronSecret))return json(401,{error:'unauthorized'});

  const apiKey=Deno.env.get('API_FOOTBALL_KEY')||'';
  const url=Deno.env.get('SUPABASE_URL')||'';
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!apiKey||!url||!serviceKey)return json(503,{error:'not_configured'});

  const sb=createClient(url,serviceKey,{auth:{persistSession:false}});
  try{
    const gateResult=await sb.rpc('get_live_score_poll_gate');
    if(gateResult.error)throw gateResult.error;
    const gate=gateResult.data?.[0]||{};
    const active_fixture_count=Number(gate.active_fixture_count||0);
    const request_count=Number(gate.request_count||0);
    if(active_fixture_count===0)return json(200,{polled:false,reason:'no_active_fixture'});
    if(request_count>=95)return json(200,{polled:false,reason:'daily_quota_guard'});
    if(!gate.five_minutes_elapsed)return json(200,{polled:false,reason:'throttled'});

    const counted=await sb.rpc('record_live_score_request');
    if(counted.error)throw counted.error;
    const providerResponse=await fetch(API_URL,{headers:{'x-apisports-key':apiKey}});
    if(!providerResponse.ok)throw new Error(`provider_${providerResponse.status}`);
    const payload=await providerResponse.json();
    const linksResult=await sb.from('live_fixture_links').select('competition,fixture_id,provider_fixture_id').eq('enabled',true);
    if(linksResult.error)throw linksResult.error;
    const links=new Map((linksResult.data||[]).map((row:any)=>[Number(row.provider_fixture_id),row]));
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
      if(shouldFinalize&&Deno.env.get('AUTO_FINALIZE_RESULTS')==='true'){
        const done=await sb.rpc('finalize_live_score_result',{p_competition:link.competition,p_fixture_id:link.fixture_id});
        if(done.error)throw done.error;
        if(done.data===true)finalized++;
      }
    }
    return json(200,{polled:true,updated,finalized});
  }catch{
    return json(502,{error:'live_score_sync_failed'});
  }
});

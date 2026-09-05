import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
import {buildFixtureSnapshot,matchProviderFixture,weeklyRequestBudget} from './core.mjs';

const API_BASE='https://v3.football.api-sports.io';
const LEAGUE_ID=203;
const PROVIDER_SEASON='2026';
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

function equalSecret(left:string|null,right:string){if(!left||!right||left.length!==right.length)return false;let diff=0;for(let i=0;i<left.length;i++)diff|=left.charCodeAt(i)^right.charCodeAt(i);return diff===0;}
async function provider(path:string,params:Record<string,string|number>,key:string){const query=new URLSearchParams(Object.entries(params).map(([name,value])=>[name,String(value)]));const response=await fetch(`${API_BASE}/${path}?${query}`,{headers:{'x-apisports-key':key}});if(!response.ok)throw new Error(`provider_${response.status}`);const payload=await response.json();if(payload?.errors&&Object.keys(payload.errors).length)throw new Error('provider_payload_error');if(!Array.isArray(payload?.response))throw new Error('provider_response_invalid');return payload.response;}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json(405,{ok:false,error:'method_not_allowed'});
  const apiKey=Deno.env.get('API_FOOTBALL_KEY')||'';
  const url=Deno.env.get('SUPABASE_URL')||'';
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  const cronSecret=Deno.env.get('FOOTBALL_CENTER_CRON_SECRET')||'';
  if(!apiKey||!url||!serviceKey||!cronSecret)return json(503,{ok:false,error:'not_configured'});
  if(!equalSecret(req.headers.get('x-football-center-secret'),cronSecret))return json(401,{ok:false,error:'unauthorized'});
  const sb=createClient(url,serviceKey,{auth:{persistSession:false}});
  let body:any={};try{body=await req.json()}catch{return json(400,{ok:false,error:'invalid_json'})}
  const mode=String(body?.mode||'scheduled');
  let due:any;
  if(mode==='manual'&&Number.isInteger(Number(body?.week))){
    const week=Number(body.week),fixturesQuery=await sb.from('fixtures').select('id,week,season').eq('week',week).order('kickoff');
    if(fixturesQuery.error)return json(500,{ok:false,error:'fixture_lookup_failed'});
    const fixtureIds=(fixturesQuery.data||[]).map((row:any)=>row.id);
    due={due:fixtureIds.length>0,sync_key:`super_lig:${fixturesQuery.data?.[0]?.season||'2026/27'}:week:${week}:manual:${Date.now()}`,fixture_ids:fixtureIds,week,season:fixturesQuery.data?.[0]?.season||'2026/27'};
  }else{
    const dueResult=await sb.rpc('match_statistics_week_due',{p_now:body?.now||new Date().toISOString()});
    if(dueResult.error)return json(500,{ok:false,error:'due_check_failed'});
    due=dueResult.data?.[0];
  }
  if(!due?.due)return json(200,{ok:true,status:'not_due',requests:0,saved:[],failures:[]});

  const fixturesQuery=await sb.from('fixtures').select('id,week,season,home_team,away_team,kickoff').in('id',due.fixture_ids||[]).order('kickoff');
  if(fixturesQuery.error)return json(500,{ok:false,error:'fixture_lookup_failed'});
  const fixtures=fixturesQuery.data||[];
  const requestBudget=weeklyRequestBudget(fixtures.length);
  if(!requestBudget)return json(200,{ok:true,status:'not_due',requests:0,saved:[],failures:[]});

  const start=await sb.from('match_statistics_sync_runs').upsert({sync_key:due.sync_key,season:due.season,week:due.week,status:'running',request_budget:requestBudget,request_count:0,saved_fixture_ids:[],started_at:new Date().toISOString(),finished_at:null,error_message:null},{onConflict:'sync_key'}).select('id').single();
  if(start.error)return json(500,{ok:false,error:'run_start_failed'});
  const reservation=await sb.rpc('reserve_api_football_requests',{p_purpose:'match_statistics',p_count:requestBudget,p_date:new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'})});
  const reserved=reservation.data?.reserved??reservation.data?.[0]?.reserved;
  if(reservation.error||reserved!==true){await sb.from('match_statistics_sync_runs').update({status:'deferred_quota',finished_at:new Date().toISOString(),error_message:'quota_not_available'}).eq('id',start.data.id);return json(200,{ok:true,status:'deferred_quota',requests:0,saved:[],failures:[]});}

  let requests=0;
  const saved:number[]=[];
  const failures:string[]=[];
  try{
    const seasonFixtures=await provider('fixtures',{league:LEAGUE_ID,season:PROVIDER_SEASON},apiKey);requests++;
    const standingsQuery=await sb.from('football_center_snapshots').select('payload').eq('competition','super_lig').eq('season',due.season).eq('category','standings').maybeSingle();
    const standings=Array.isArray(standingsQuery.data?.payload)?standingsQuery.data.payload:[];
    const h2hAllowance=Math.max(0,requestBudget-1);
    for(let index=0;index<fixtures.length;index++){
      const fixture=fixtures[index];
      try{
        const providerFixture=matchProviderFixture(fixture,seasonFixtures);
        if(!providerFixture)throw new Error('fixture_mapping_missing');
        let headToHead=seasonFixtures.filter((row:any)=>{
          const ids=[Number(row?.teams?.home?.id),Number(row?.teams?.away?.id)].sort((a,b)=>a-b).join('-');
          return ids===[Number(providerFixture.teams.home.id),Number(providerFixture.teams.away.id)].sort((a,b)=>a-b).join('-');
        });
        if(index<h2hAllowance){headToHead=await provider('fixtures/headtohead',{h2h:`${providerFixture.teams.home.id}-${providerFixture.teams.away.id}`,last:5},apiKey);requests++;}
        const fetchedAt=new Date().toISOString();
        const payload=buildFixtureSnapshot({internalFixture:fixture,providerFixture,seasonFixtures,headToHead,standings,fetchedAt});
        const save=await sb.from('match_statistics_snapshots').upsert({fixture_id:fixture.id,week:fixture.week,season:fixture.season||due.season,home_team:fixture.home_team,away_team:fixture.away_team,payload,fetched_at:fetchedAt},{onConflict:'fixture_id'});
        if(save.error)throw new Error('snapshot_save_failed');
        saved.push(fixture.id);
      }catch(error){failures.push(`${fixture.id}:${error instanceof Error?error.message:'unknown'}`);}
    }
  }catch(error){failures.push(`week:${error instanceof Error?error.message:'unknown'}`);}

  const status=failures.length?(saved.length?'partial':'failed'):'succeeded';
  await sb.from('match_statistics_sync_runs').update({status:status==='partial'?'partial':status,request_count:requests,saved_fixture_ids:saved,finished_at:new Date().toISOString(),error_message:failures.length?failures.join(','):null}).eq('id',start.data.id);
  return json(status==='failed'?502:200,{ok:status!=='failed',status,requests,saved,failures});
});

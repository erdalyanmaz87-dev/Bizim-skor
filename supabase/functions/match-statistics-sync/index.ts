import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
import {authorizeRequest,buildLocalFixtureSnapshot} from './core.mjs';

const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json(405,{ok:false,error:'method_not_allowed'});
  const url=Deno.env.get('SUPABASE_URL')||'';
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  const cronSecret=Deno.env.get('FOOTBALL_CENTER_CRON_SECRET')||'';
  if(!url||!serviceKey)return json(503,{ok:false,error:'not_configured'});
  const sb=createClient(url,serviceKey,{auth:{persistSession:false}});
  const authorized=await authorizeRequest({
    suppliedSecret:req.headers.get('x-football-center-secret'),
    environmentSecret:cronSecret,
    databaseAuthorize:async(secret:string)=>{
      const result=await sb.rpc('authorize_football_center_cron',{p_secret:secret});
      return result.error==null&&result.data===true;
    }
  });
  if(!authorized)return json(401,{ok:false,error:'unauthorized'});

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

  const [targetsQuery,historyQuery,resultsQuery,standingsQuery]=await Promise.all([
    sb.from('fixtures').select('id,week,season,home_team,away_team,kickoff').in('id',due.fixture_ids||[]).order('kickoff'),
    sb.from('fixtures').select('id,week,season,home_team,away_team,kickoff').eq('season',due.season).order('kickoff'),
    sb.from('results').select('fixture_id,home_score,away_score'),
    sb.from('football_center_snapshots').select('payload').eq('competition','super_lig').eq('season',due.season).eq('category','standings').maybeSingle()
  ]);
  if(targetsQuery.error||historyQuery.error||resultsQuery.error)return json(500,{ok:false,error:'source_lookup_failed'});
  const fixtures=targetsQuery.data||[];
  if(!fixtures.length)return json(200,{ok:true,status:'not_due',requests:0,saved:[],failures:[]});
  const resultMap=new Map((resultsQuery.data||[]).map((row:any)=>[Number(row.fixture_id),row]));
  const completedMatches=(historyQuery.data||[]).map((fixture:any)=>({...fixture,...resultMap.get(Number(fixture.id))})).filter((row:any)=>Number.isInteger(Number(row.home_score))&&Number.isInteger(Number(row.away_score)));
  const standings=Array.isArray(standingsQuery.data?.payload)?standingsQuery.data.payload:[];

  const start=await sb.from('match_statistics_sync_runs').upsert({sync_key:due.sync_key,season:due.season,week:due.week,status:'running',request_budget:1,request_count:0,saved_fixture_ids:[],started_at:new Date().toISOString(),finished_at:null,error_message:null},{onConflict:'sync_key'}).select('id').single();
  if(start.error)return json(500,{ok:false,error:'run_start_failed'});
  const saved:number[]=[],failures:string[]=[];
  for(const fixture of fixtures){
    try{
      const fetchedAt=new Date().toISOString();
      const payload=buildLocalFixtureSnapshot({internalFixture:fixture,completedMatches,standings,fetchedAt});
      const save=await sb.from('match_statistics_snapshots').upsert({fixture_id:fixture.id,week:fixture.week,season:fixture.season||due.season,home_team:fixture.home_team,away_team:fixture.away_team,payload,fetched_at:fetchedAt},{onConflict:'fixture_id'});
      if(save.error)throw new Error('snapshot_save_failed');
      saved.push(fixture.id);
    }catch(error){failures.push(`${fixture.id}:${error instanceof Error?error.message:'unknown'}`);}
  }
  const status=failures.length?(saved.length?'partial':'failed'):'succeeded';
  await sb.from('match_statistics_sync_runs').update({status,request_count:0,saved_fixture_ids:saved,finished_at:new Date().toISOString(),error_message:failures.length?failures.join(','):null}).eq('id',start.data.id);
  return json(status==='failed'?500:200,{ok:status!=='failed',status,requests:0,saved,failures,source:'game_results'});
});

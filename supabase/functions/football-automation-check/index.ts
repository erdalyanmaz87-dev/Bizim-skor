import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return json(405,{error:'method_not_allowed'});
 const secret=req.headers.get('x-cron-secret');
 const sb=createClient(Deno.env.get('SUPABASE_URL')||'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',{auth:{persistSession:false}});
 if(!secret)return json(401,{error:'unauthorized'});
 const auth=await sb.rpc('authorize_live_score_cron',{p_secret:secret});
 if(auth.error||auth.data!==true)return json(401,{error:'unauthorized'});
 let body:any={};try{body=await req.json()}catch{}
 if(body.provider==='soccersapi'){
  const token=Deno.env.get('SOCCERSAPI_TOKEN')||'';
  if(!token)return json(200,{provider:'soccersapi',configured:false,ready:false,error:'SOCCERSAPI_TOKEN_missing'});
  try{
   const response=await fetch('https://api.soccersapi.com/v2.2/leagues/?t=list',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
   const payload=await response.json();
   const leagues=Array.isArray(payload.data)?payload.data:[];
   const ids=new Set(leagues.map((row:any)=>Number(row.id)));
   const coverage={super_lig:ids.has(3515),champions_league:ids.has(539),nations_league:ids.has(366)};
   return json(200,{provider:'soccersapi',configured:true,ready:response.ok&&Object.values(coverage).every(Boolean),provider_status:response.status,coverage,
    leagues:leagues.map((row:any)=>({id:row.id,name:row.name})),message:payload.meta?.msg||null,requests_left:payload.meta?.requests_left??null});
  }catch{return json(502,{provider:'soccersapi',configured:true,ready:false,error:'soccersapi_connection_failed'});}
 }
 const key=Deno.env.get('API_FOOTBALL_KEY')||'';
 if(!key)return json(503,{error:'provider_key_missing'});
 const date=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
 async function request(path:string){
  const budget=await sb.rpc('reserve_api_football_requests',{p_purpose:'live_score',p_count:1,p_date:date});
  if(budget.error)throw new Error('quota_reservation_failed');
  if((budget.data?.[0]?.reserved??budget.data?.reserved)!==true)throw new Error('daily_quota_guard');
  const response=await fetch('https://v3.football.api-sports.io/'+path,{headers:{'x-apisports-key':key},signal:AbortSignal.timeout(15000)});
  const payload=await response.json();
  return {status:response.status,payload};
 }
 try{
  const status=await request('status');
  const info=status.payload?.response||{};
  const subscription={plan:info.subscription?.plan,active:info.subscription?.active,end:info.subscription?.end,requests:info.requests};
  if(status.status!==200||Object.keys(status.payload?.errors||{}).length||subscription.active===false)
   return json(200,{ready:false,subscription,provider_status:status.status,errors:status.payload?.errors||{}});
  const competitions=[];
  for(const [competition,league] of [['super_lig',203],['champions_league',2],['nations_league',5]] as const){
   const check=await request('fixtures?league='+league+'&season=2026');
   const rows=Array.isArray(check.payload?.response)?check.payload.response:[];
   const upcoming=rows.filter((r:any)=>Date.parse(r?.fixture?.date)>Date.now());
   competitions.push({competition,provider_status:check.status,errors:check.payload?.errors||{},count:rows.length,upcoming_count:upcoming.length,
    upcoming_sample:upcoming.slice(0,3).map((r:any)=>({id:r.fixture?.id,kickoff:r.fixture?.date,round:r.league?.round,home:r.teams?.home?.name,away:r.teams?.away?.name}))});
  }
  return json(200,{ready:competitions.every(c=>c.provider_status===200&&!Object.keys(c.errors).length&&c.upcoming_count>0),subscription,competitions});
 }catch(error){return json(502,{error:error instanceof Error?error.message:'provider_check_failed'});}
});
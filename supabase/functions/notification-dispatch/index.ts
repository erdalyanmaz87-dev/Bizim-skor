import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";
import { reminderThreshold, predictionIsComplete, exactScoreReached, deliveryKey } from "./core.mjs";

const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const jsonHeaders={"content-type":"application/json"};
const targetUrl="https://bizim-skor-live.vercel.app";
const normalize=(value:unknown)=>String(value||'').trim().toLocaleLowerCase('tr-TR');

async function reserveDelivery(key:string,type:string,player:string,endpoint:string){
  const result=await sb.from('push_delivery_log').insert({delivery_key:key,event_type:type,player_name:player,endpoint}).select('id').single();
  if(result.error?.code==='23505')return null;
  if(result.error)throw result.error;
  return result.data.id;
}

async function deliver(subscription:any,eventKey:string,eventType:string,title:string,body:string){
  const key=deliveryKey(eventKey,subscription.player_name,subscription.endpoint);
  const logId=await reserveDelivery(key,eventType,subscription.player_name,subscription.endpoint);
  if(!logId)return false;
  try{
    const response=await webpush.sendNotification({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}},JSON.stringify({title,body,url:targetUrl}));
    await sb.from('push_delivery_log').update({response_status:response.statusCode||201}).eq('id',logId);
    return true;
  }catch(error){
    const status=Number(error?.statusCode||error?.status||0);
    if(status===404||status===410)await sb.from('push_subscriptions').delete().eq('id',subscription.id);
    else await sb.from('push_delivery_log').delete().eq('id',logId);
    throw error;
  }
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return new Response(JSON.stringify({ok:false,error:'method not allowed'}),{status:405,headers:jsonHeaders});
  try{
    const secret=req.headers.get('x-cron-secret')||'';
    const authz=await sb.rpc('authorize_notification_cron',{p_secret:secret});
    if(authz.error||authz.data!==true)return new Response(JSON.stringify({ok:false,error:'unauthorized'}),{status:401,headers:jsonHeaders});

    const config=await sb.from('push_config').select('vapid_public,vapid_private').eq('id',1).single();
    if(config.error)throw config.error;
    webpush.setVapidDetails(targetUrl,config.data.vapid_public,config.data.vapid_private);
    const subscriptionsResult=await sb.from('push_subscriptions').select('id,player_name,endpoint,p256dh,auth');
    if(subscriptionsResult.error)throw subscriptionsResult.error;
    const subscriptions=(subscriptionsResult.data||[]).filter(s=>s.player_name);
    let sent=0,failed=0;

    const now=new Date(),until=new Date(now.getTime()+24*60*60*1000).toISOString();
    const fixturesResult=await sb.from('fixtures').select('id,week,kickoff').gt('kickoff',now.toISOString()).lte('kickoff',until).order('kickoff');
    if(fixturesResult.error)throw fixturesResult.error;
    const weeks=new Map<number,any[]>();
    for(const fixture of fixturesResult.data||[]){const list=weeks.get(Number(fixture.week))||[];list.push(fixture);weeks.set(Number(fixture.week),list)}
    for(const [week,fixtures] of weeks){
      const firstKickoff=new Date(fixtures[0].kickoff),hours=(firstKickoff.getTime()-now.getTime())/3600000,threshold=reminderThreshold(hours);
      if(!threshold)continue;
      const allFixtures=await sb.from('fixtures').select('id').eq('week',week);
      if(allFixtures.error)throw allFixtures.error;
      const fixtureIds=(allFixtures.data||[]).map(f=>f.id),predictions=fixtureIds.length?await sb.from('predictions').select('player_name,fixture_id').in('fixture_id',fixtureIds):{data:[],error:null};
      if(predictions.error)throw predictions.error;
      const counts=new Map<string,number>();
      for(const prediction of predictions.data||[]){const key=normalize(prediction.player_name);counts.set(key,(counts.get(key)||0)+1)}
      for(const subscription of subscriptions){
        if(predictionIsComplete(counts.get(normalize(subscription.player_name))||0,fixtureIds.length))continue;
        const label=threshold==='24h'?'24 saat':'3 saat';
        try{if(await deliver(subscription,`reminder:${week}:${threshold}`,'prediction_reminder',`${week}. Hafta tahminlerini unutma!`,`Tahminlerin ${label} sonra, ilk maç başladığında kapanacak.`))sent++}catch{failed++}
      }
    }

    const recent=new Date(now.getTime()-10*60*1000).toISOString();
    const liveResult=await sb.from('live_score_cache').select('competition,fixture_id,status,home_score,away_score,fetched_at').gte('fetched_at',recent).not('status','in','(FT,AET,PEN)');
    if(liveResult.error)throw liveResult.error;
    for(const live of liveResult.data||[]){
      const table=live.competition==='champions_league'?'champions_league_predictions':'predictions';
      const predictions=await sb.from(table).select('player_name,home_score,away_score').eq('fixture_id',live.fixture_id);
      if(predictions.error)throw predictions.error;
      for(const prediction of predictions.data||[]){
        if(!exactScoreReached(prediction,live))continue;
        for(const subscription of subscriptions.filter(s=>normalize(s.player_name)===normalize(prediction.player_name))){
          try{if(await deliver(subscription,`exact:${live.competition}:${live.fixture_id}`,'exact_score','🎯 Şu an tam biliyorsun!','Maç böyle biterse doğru skoru bileceksin.'))sent++}catch{failed++}
        }
      }
    }
    return new Response(JSON.stringify({ok:failed===0,sent,failed}),{headers:jsonHeaders});
  }catch(error){return new Response(JSON.stringify({ok:false,error:String(error?.message||error)}),{status:500,headers:jsonHeaders})}
});
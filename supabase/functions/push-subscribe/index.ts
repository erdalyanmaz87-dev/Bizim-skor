import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors={"access-control-allow-origin":"*","access-control-allow-headers":"content-type,authorization,apikey,x-client-info","access-control-allow-methods":"POST,OPTIONS"};
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return new Response(JSON.stringify({ok:false,error:'method not allowed'}),{status:405,headers:{...cors,'content-type':'application/json'}});
  try{
    const b=await req.json();
    const endpoint=String(b.endpoint||'').trim(),p256dh=String(b.p256dh||'').trim(),auth=String(b.auth||'').trim();
    if(!endpoint||!p256dh||!auth)throw new Error('subscription fields required');
    const parsed=new URL(endpoint);
    if(parsed.protocol!=='https:')throw new Error('invalid endpoint');
    const row={endpoint,p256dh,auth,player_name:b.player_name?String(b.player_name).slice(0,100):null,device_id:b.device_id?String(b.device_id).slice(0,200):null,user_agent:b.user_agent?String(b.user_agent).slice(0,500):null,updated_at:new Date().toISOString()};
    const {error}=await sb.from('push_subscriptions').upsert(row,{onConflict:'endpoint'});
    if(error)throw error;
    return new Response(JSON.stringify({ok:true}),{headers:{...cors,'content-type':'application/json'}});
  }catch(e){return new Response(JSON.stringify({ok:false,error:String(e?.message||e)}),{status:400,headers:{...cors,'content-type':'application/json'}})}
});

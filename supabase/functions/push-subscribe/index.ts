import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors={"access-control-allow-origin":"*","access-control-allow-headers":"content-type,authorization,apikey,x-client-info","access-control-allow-methods":"POST,DELETE,OPTIONS"};
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST'&&req.method!=='DELETE')return new Response(JSON.stringify({ok:false,error:'method not allowed'}),{status:405,headers:{...cors,'content-type':'application/json'}});
  try{
    const b=await req.json();
    const endpoint=String(b.endpoint||'').trim(),token=String(b.p_token||'').trim();
    if(!endpoint||!token)throw new Error('subscription fields required');
    const parsed=new URL(endpoint);if(parsed.protocol!=='https:')throw new Error('invalid endpoint');
    const session=await sb.rpc('friend_session_player',{p_token:token});
    if(session.error)throw session.error;
    const player=String(session.data||'').trim();
    if(!player)return new Response(JSON.stringify({ok:false,error:'Oturum geçersiz veya süresi dolmuş.'}),{status:401,headers:{...cors,'content-type':'application/json'}});
    if(req.method==='DELETE'){
      const removed=await sb.from('push_subscriptions').delete().eq('player_name',player).eq('endpoint',endpoint);
      if(removed.error)throw removed.error;
      return new Response(JSON.stringify({ok:true}),{headers:{...cors,'content-type':'application/json'}});
    }
    const p256dh=String(b.p256dh||'').trim(),auth=String(b.auth||'').trim();
    if(!p256dh||!auth)throw new Error('subscription fields required');
    const row={endpoint,p256dh,auth,player_name:player};
    const {error}=await sb.from('push_subscriptions').upsert(row,{onConflict:'endpoint'});if(error)throw error;
    return new Response(JSON.stringify({ok:true}),{headers:{...cors,'content-type':'application/json'}});
  }catch(e){return new Response(JSON.stringify({ok:false,error:String(e?.message||e)}),{status:400,headers:{...cors,'content-type':'application/json'}})}
});
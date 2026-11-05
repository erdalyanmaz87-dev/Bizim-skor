import {createClient} from 'npm:@supabase/supabase-js@2';
import {createFcmTransport} from '../_shared/fcm.mjs';
import {authorizePushRequest} from '../send-push/authorization.mjs';
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb=createClient(Deno.env.get('SUPABASE_URL')!,serviceKey);
Deno.serve(async(req:Request)=>{
 const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
 if(req.method!=='POST')return json(405,{ok:false,error:'method_not_allowed'});
 const authorized=await authorizePushRequest(req,{serviceKey,authorizeCron:async(secret:string)=>{const r=await sb.rpc('authorize_notification_cron',{p_secret:secret});return !r.error&&r.data===true}});
 if(!authorized)return json(401,{ok:false,error:'unauthorized'});
 try{const fcm=createFcmTransport(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')||'');await fcm.check();return json(200,{ok:true,configured:true,oauth_valid:true,fcm_permission_valid:true,validate_only:true,notifications_sent:0})}
 catch(error){const safe=/^(firebase_|fcm_)/.test(error?.message||'')?error.message:'firebase_configuration_check_failed';return json(503,{ok:false,error:safe,notifications_sent:0})}
});

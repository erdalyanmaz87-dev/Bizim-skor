import {createClient} from 'npm:@supabase/supabase-js@2';
import {handleSubscription} from './core.mjs';
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb=createClient(Deno.env.get('SUPABASE_URL')!,serviceKey);
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization,apikey,x-client-info','access-control-allow-methods':'POST,OPTIONS','content-type':'application/json','cache-control':'no-store'};
const hmac=crypto.subtle.importKey('raw',new TextEncoder().encode(serviceKey),{name:'HMAC',hash:'SHA-256'},false,['sign']);
async function keyHash(value:string){return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',await hmac,new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('')}
Deno.serve(async(req:Request)=>{
 const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:cors});
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return json(405,{ok:false,error:'method_not_allowed'});
 try{const text=await req.text();if(text.length>12000)return json(413,{ok:false,error:'body_too_large'});
 const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim().slice(0,200);
 const result=await handleSubscription(JSON.parse(text),{
 gate:async(device:string)=>{const keys=await Promise.all(['native-push:global','native-push:ip:'+ip,'native-push:device:'+device].map(keyHash));const q=await sb.rpc('mobile_auth_gate',{p_keys:keys,p_limits:[1000,300,60]});return !q.error&&q.data===true},
 write:async(params:object)=>{const q=await sb.rpc('set_native_push_device',params);if(q.error)throw new Error(q.error.message);return q.data}
 });return json(result.status,result.body);
 }catch(error){const code=String(error?.message||'');return json(/unauthorized/.test(code)?401:400,{ok:false,error:/unauthorized/.test(code)?'unauthorized':'subscription_unavailable'})}
});

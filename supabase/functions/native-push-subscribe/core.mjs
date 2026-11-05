export async function handleSubscription(b,{gate,write}){
 if(!b||!(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(b.device_id||''))||!(/^[a-f0-9]{64}$/.test(b.secret||''))||!Number.isSafeInteger(b.revision)||b.revision<1||typeof b.enabled!=='boolean')return {status:400,body:{ok:false,error:'invalid_device'}};
 if(b.enabled&&(!/^[A-Za-z0-9_:\-]{40,4096}$/.test(b.fcm_token||'')||!String(b.p_token||'').trim()))return {status:b.p_token?400:401,body:{ok:false,error:'invalid_subscription'}};
 if(!await gate(b.device_id))return {status:429,body:{ok:false,error:'rate_limited'}};
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b.secret));const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 const result=await write({p_device:b.device_id,p_secret_hash:hash,p_revision:b.revision,p_enabled:b.enabled,p_token:b.enabled?String(b.p_token):'',p_fcm_token:b.enabled?b.fcm_token:''});
 return {status:200,body:result};
}

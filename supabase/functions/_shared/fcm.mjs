const PROJECT='bizimskor',OAUTH='https://oauth2.googleapis.com/token';
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const jsonPart=value=>encode(new TextEncoder().encode(JSON.stringify(value)));
function failure(code,status=0,unregistered=false){const error=new Error(code);error.status=status;error.unregistered=unregistered;return error}
export function createFcmTransport(raw,{fetchFn=fetch,now=Date.now}={}){
 if(!raw)throw failure('firebase_credentials_missing');let sa;try{sa=JSON.parse(raw)}catch{throw failure('firebase_credentials_invalid_json')}
 if(sa.project_id!==PROJECT||sa.client_email!=='bizimskor-bildirim@bizimskor.iam.gserviceaccount.com'||!String(sa.private_key||'').startsWith('-----BEGIN PRIVATE KEY-----'))throw failure('firebase_credentials_wrong_account');
 let cached=null,key=null;
 async function accessToken(){
  if(cached&&cached.until>now()+60000)return cached.value;
  if(!key){const der=String(sa.private_key).replace(/-----[^-]+-----|\s/g,'');key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(der),x=>x.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign'])}
  const iat=Math.floor(now()/1000),payload=jsonPart({alg:'RS256',typ:'JWT'})+'.'+jsonPart({iss:sa.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:OAUTH,iat,exp:iat+3600});
  const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(payload));
  const response=await fetchFn(OAUTH,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:payload+'.'+encode(new Uint8Array(signature))}),signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>({}));if(!response.ok||!data.access_token)throw failure('firebase_oauth_rejected',response.status);
  cached={value:data.access_token,until:now()+Math.min(Number(data.expires_in)||3600,3600)*1000};return cached.value;
 }
 async function request(message,validateOnly=false){
  const token=await accessToken();const response=await fetchFn(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`,{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({validate_only:validateOnly,message}),signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401)cached=null;const detail=(data.error?.details||[]).find(d=>d['@type']==='type.googleapis.com/google.firebase.fcm.v1.FcmError');const code=detail?.errorCode||data.error?.status||'request_failed';throw failure('fcm_'+String(code).replace(/[^A-Z_a-z]/g,''),response.status,detail?.errorCode==='UNREGISTERED')}
  return {ok:true};
 }
 return {check:()=>request({topic:'bizimskor-config-check',notification:{title:'Yapılandırma kontrolü',body:'Gönderilmeyen doğrulama isteği'}},true),send:({token,title,body,url='https://bizimskor.com'})=>{
  if(!/^[A-Za-z0-9_:\-]{40,4096}$/.test(String(token||'')))throw failure('invalid_fcm_token');
  return request({token,notification:{title:String(title).slice(0,200),body:String(body).slice(0,2000)},data:{url:String(url).startsWith('https://bizimskor.com')?String(url):'https://bizimskor.com'},android:{priority:'high',notification:{channel_id:'prediction-reminders',sound:'default'}}});
 }};
}

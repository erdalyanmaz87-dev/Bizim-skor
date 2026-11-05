(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorNativePush=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
function createController({plugin,read,save,session,enabled,send,onError=()=>{},onAction=()=>{}}){
 const device=read();let owner='',generation=0,initialized=false,active=false,bound=false,needsRevoke=false,listening;
 const desired=()=>enabled()?String(session()||''):'';
 async function transmit(on,token='',account=''){
  device.revision=Number(device.revision||0)+1;save({...device});
  const body={device_id:device.device_id,secret:device.secret,revision:device.revision,enabled:on};
  if(on){body.fcm_token=token;body.p_token=account}
  const result=await send(body);if(!result?.ok)throw new Error('Bildirim kaydı tamamlanamadı.');return result.applied!==false;
 }
 async function listeners(){if(!listening)listening=(async()=>{
  await plugin.addListener('registration',async event=>{const account=owner,version=generation;if(!active||!account||desired()!==account)return;
   try{const applied=await transmit(true,String(event.value||''),account);if(generation===version&&desired()===account)bound=applied}
   catch(error){if(generation===version){bound=false;active=false}onError(error)}
  });
  await plugin.addListener('registrationError',()=>{active=false;bound=false;onError(new Error('Android bildirim servisi henüz bağlanamadı.'))});
  await plugin.addListener('pushNotificationActionPerformed',onAction);
 })();return listening}
 async function refresh(){
  const account=desired();const changed=!initialized||owner!==account;
  if(changed){initialized=true;owner=account;generation++;bound=false;needsRevoke=Number(device.revision)>0;}
  const version=generation;
  try{
   // No network queue: opt-out invalidates local state and starts native unregister immediately.
   if(changed||needsRevoke){active=false;await plugin.unregister();if(needsRevoke){await transmit(false);if(version===generation)needsRevoke=false}}
   if(version!==generation||!account||desired()!==account)return;
   await listeners();if(version!==generation||desired()!==account)return;
   const permission=await plugin.checkPermissions();
   if(version!==generation||desired()!==account)return;
   if(permission.receive!=='granted'){owner='';active=false;bound=false;generation++;needsRevoke=true;await plugin.unregister();await transmit(false);needsRevoke=false;return}
   if(version!==generation||desired()!==account)return;
   if(bound&&active)return;
   active=true;await plugin.register();
  }catch(error){if(version===generation){bound=false;active=false}onError(error)}
 }
 return {refresh,isBound:()=>bound&&!!owner&&owner===desired()};
}
function mount(){
 if(!root.document||!root.Capacitor?.isNativePlatform?.())return;
 let plugin;try{plugin=root.Capacitor.registerPlugin?.('PushNotifications')||root.Capacitor.Plugins?.PushNotifications}catch{}if(!plugin)return;
 const key='bizimSkorNativePushDevice';let stored;try{stored=JSON.parse(root.localStorage.getItem(key)||'null')}catch{}
 if(!stored?.device_id||!stored?.secret){stored={device_id:root.crypto.randomUUID(),secret:Array.from(root.crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''),revision:0};root.localStorage.setItem(key,JSON.stringify(stored))}
 const api=createController({plugin,read:()=>stored,save:value=>{stored=value;root.localStorage.setItem(key,JSON.stringify(value))},session:()=>root.localStorage.getItem('bizimSkorFriendToken'),enabled:()=>root.localStorage.getItem('bizimSkorNativeReminders')==='1',send:async body=>{const q=await root.BizimSkorMobileHooks.client.functions.invoke('native-push-subscribe',{body,signal:AbortSignal.timeout(15000)});if(q.error)throw new Error('Bildirim sunucusuna bağlanılamadı.');return q.data},onError:()=>{root.BizimSkorNativePush.status='pending'},onAction:()=>root.document.querySelector('[data-tab="pred"]')?.click()});
 Object.assign(root.BizimSkorNativePush,api);
 for(const event of ['bizimskor:logged-out','bizimskor:session-ready','bizimskor:notification-preference'])root.addEventListener(event,api.refresh);
 root.document.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')api.refresh()});
 root.setInterval(api.refresh,60000);root.setTimeout(api.refresh,1600);
}
return {createController,mount};
});

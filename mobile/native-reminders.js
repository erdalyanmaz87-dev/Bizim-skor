(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorNativeReminders=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const ENABLED='bizimSkorNativeReminders',IDS='bizimSkorNativeReminderIds';
function idFor(key){let n=0;for(const c of key)n=(Math.imul(n,31)+c.charCodeAt(0))|0;return 100000+(n>>>0)%2000000000}
function plan(rows,now=Date.now()){const out=[];for(const row of rows||[]){const deadline=Date.parse(row.deadline);if(!Number.isFinite(deadline)||deadline<=now||!Number(row.fixture_count)||Number(row.saved_count)>=Number(row.fixture_count))continue;const key=`${row.competition}:${row.week}:${deadline}`;let times=[deadline-24*3600000,deadline-3600000].filter(t=>t>now+60000);if(!times.length&&deadline>now+5*60000)times=[deadline-5*60000];for(const at of times)out.push({id:idFor(key+':'+at),title:'BizimSkor • Tahmin Hatırlatması',body:`${row.label||'Maç'} ${row.week}. hafta tahminlerin eksik. İlk maç başlamadan tamamla.`,schedule:{at:new Date(at)},channelId:'prediction-reminders',extra:{competition:row.competition,week:Number(row.week),deadline:row.deadline},autoCancel:true});}return out.slice(0,30)}
async function replace(plugin,next,previous=[]){if(previous.length)await plugin.cancel({notifications:previous.map(x=>({id:x.id}))});if(next.length)await plugin.schedule({notifications:next});return next.map(x=>({id:x.id}))}
function mount(){const doc=root.document;if(!doc||!root.Capacitor?.isNativePlatform?.())return;let plugin;try{plugin=root.Capacitor.registerPlugin?.('LocalNotifications')||root.Capacitor.Plugins?.LocalNotifications}catch{}if(!plugin)return;let busy=false,queued=false,lastToken='';const storage=root.localStorage;const previous=()=>{try{return JSON.parse(storage.getItem(IDS)||'[]')}catch{return []}};
 // Native writes are serialized; network requests never block cancellation.
 let writes=Promise.resolve();
 function write(action){const next=writes.then(action);writes=next.catch(()=>{});return next}
 function cancel(){return write(async()=>{await replace(plugin,[],previous());storage.removeItem(IDS)})}
 async function refresh(){
  const current=storage.getItem('bizimSkorFriendToken')||'';
  if(current!==lastToken||!current||storage.getItem(ENABLED)!=='1'){
   lastToken=current;
   try{await cancel()}catch(error){console.warn('native reminder cancellation',error)}
  }
  queued=true;if(busy)return;busy=true;
  try{while(queued){queued=false;
   try{
    const token=storage.getItem('bizimSkorFriendToken')||'';
    const enabled=()=>storage.getItem(ENABLED)==='1'&&(storage.getItem('bizimSkorFriendToken')||'')===token;
    if(!token||!enabled())continue;
    if((await plugin.checkPermissions()).display!=='granted'){await cancel();continue}
    const q=await root.BizimSkorMobileHooks.client.rpc('get_prediction_reminder_status',{p_token:token,p_now:new Date().toISOString()});
    if(q.error)throw q.error;
    if(!enabled()){queued=true;continue}
    const next=plan(q.data||[]);
    await write(async()=>{
     if(!enabled())return;
     await replace(plugin,[],previous());storage.removeItem(IDS);
     if(!enabled())return;
     // Record IDs before the bridge call so a partial schedule failure remains cancellable.
     storage.setItem(IDS,JSON.stringify(next.map(x=>({id:x.id}))));
     await replace(plugin,next,[]);
     if(!enabled()){await replace(plugin,[],previous());storage.removeItem(IDS)}
    });
   }catch(error){console.warn('native reminders',error)}
  }}finally{busy=false}
 }
 async function toggle(){const button=doc.getElementById('nativeReminderToggle');try{if(storage.getItem(ENABLED)==='1'){storage.removeItem(ENABLED);storage.removeItem('bizimSkorPushEnabledV1');await refresh()}else{const p=await plugin.requestPermissions();if(p.display!=='granted')throw new Error('Telefon ayarlarından BizimSkor bildirim iznini açabilirsin.');await plugin.createChannel({id:'prediction-reminders',name:'Tahmin Hatırlatmaları',importance:4,visibility:1});storage.setItem(ENABLED,'1');storage.setItem('bizimSkorPushEnabledV1','1');await refresh()}update();}catch(error){root.alert?.(error.message)}finally{if(button)button.disabled=false}}
 function update(){let button=doc.getElementById('nativeReminderToggle');if(!button){const host=doc.getElementById('logoutPlayer');if(!host)return;button=doc.createElement('button');button.id='nativeReminderToggle';button.type='button';button.className='full';host.insertAdjacentElement('afterend',button);button.addEventListener('click',()=>{button.disabled=true;toggle()})}button.textContent=storage.getItem(ENABLED)==='1'?'🔕 Tahmin Hatırlatmalarını Kapat':'🔔 Tahmin Hatırlatmalarını Aç';}
 plugin.addListener?.('localNotificationActionPerformed',event=>{const row=event.notification?.extra;if(!row)return;if(row.competition==='champions')root.BizimSkorChampionsUI?.openPrediction?.();else if(row.competition==='nations')root.BizimSkorNationsUI?.openPrediction?.(row.week);else doc.querySelector('[data-tab="pred"]')?.click()});
 root.addEventListener('bizimskor:logged-out',refresh);root.addEventListener('bizimskor:session-ready',()=>{update();refresh()});doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='visible')refresh()});root.addEventListener('storage',e=>{if(['bizimSkorFriendToken',ENABLED].includes(e.key))refresh()});doc.addEventListener('click',event=>{if(event.target.closest?.('#logoutPlayer'))root.setTimeout(refresh,500)});root.setInterval(()=>{const token=storage.getItem('bizimSkorFriendToken')||'';if(token!==lastToken||doc.visibilityState==='visible')refresh()},60000);update();root.setTimeout(refresh,1500);
 root.BizimSkorNativeReminders.refresh=refresh;
 root.BizimSkorNativeReminders.toggle=toggle;
 root.BizimSkorPush={toggle,enabled:()=>storage.getItem(ENABLED)==='1',init:refresh};
}
return {idFor,plan,replace,mount};
});

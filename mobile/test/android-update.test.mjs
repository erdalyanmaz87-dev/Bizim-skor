import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {parseHTML} from 'linkedom';
const require=createRequire(import.meta.url);
const ui=require('../android-ui.js');
const reminders=require('../native-reminders.js');
test('country flag assets use one geometry and escape team labels',()=>{
 for(const name of ['Yunanistan','Hollanda','Sırbistan','Almanya','Norveç','Galler','Portekiz','Danimarka'])assert.match(ui.nationalMarkup(name),/width="28" height="21"/);
 assert.equal(ui.countryCode('Galler'),'gb-wls');assert.equal(ui.countryCode('Almanya'),'de');assert.doesNotMatch(ui.nationalMarkup('<script>'),/<script>/);
});
test('Arena rules survive replacing the shell, close, and return to the same screen',()=>{
 const {document,window}=parseHTML('<html><body><div id="leagueSystemPanel"><div class="league-shell"><button data-league-rules>Kurallar</button><div class="league-rules-host" hidden><div class="league-rules">Kurallar</div></div></div></div></body></html>');
 ui.mount(document,{observe:false});document.querySelector('[data-league-rules]').click();assert.equal(document.querySelector('.league-rules-host').hidden,false);
 document.querySelector('[data-android-rules-close]').click();assert.equal(document.querySelector('.league-rules-host').hidden,true);
 document.querySelector('#leagueSystemPanel').innerHTML='<div class="league-shell"><button data-league-rules>Kurallar</button><div class="league-rules-host" hidden>Yeni kurallar</div></div>';
 document.querySelector('[data-league-rules]').click();assert.equal(document.querySelector('.league-rules-host').hidden,false);
 assert.ok(document.querySelector('#leagueSystemPanel'));
});
test('reminder plan includes only incomplete, future weeks and has stable ids',()=>{
 const now=Date.parse('2026-11-05T10:00:00Z');const rows=[{competition:'super',week:11,deadline:'2026-11-06T18:00:00Z',saved_count:0,fixture_count:9,label:'Süper Lig'},{competition:'champions',week:4,deadline:'2026-11-06T18:00:00Z',saved_count:9,fixture_count:9},{competition:'nations',week:6,deadline:'2026-11-04T18:00:00Z',saved_count:0,fixture_count:8}];
 const a=reminders.plan(rows,now);assert.ok(a.length);assert.equal(new Set(a.map(x=>x.id)).size,a.length);assert.ok(a.every(x=>x.extra.competition==='super'&&x.schedule.at.getTime()>now));assert.deepEqual(a.map(x=>x.id),reminders.plan(rows,now).map(x=>x.id));
});
test('disabled or signed-out reminders cancel only our prior ids without scheduling',async()=>{
 const calls=[];const plugin={cancel:async x=>calls.push(['cancel',x]),schedule:async x=>calls.push(['schedule',x])};
 await reminders.replace(plugin,[],[{id:121}]);assert.deepEqual(calls,[['cancel',{notifications:[{id:121}]}]]);
});
test('disabling while reminder RPC is pending never schedules a notification',async()=>{
 const {readFileSync}=await import('node:fs');const vm=await import('node:vm');
 const values=new Map([['bizimSkorFriendToken','token'],['bizimSkorNativeReminders','1']]);
 const calls=[];let release;const pending=new Promise(r=>release=r);
 const plugin={checkPermissions:async()=>({display:'granted'}),cancel:async()=>calls.push('cancel'),schedule:async()=>calls.push('schedule'),addListener:()=>{}};
 const document={getElementById:()=>null,addEventListener:()=>{},visibilityState:'visible'};
 const context={document,Capacitor:{isNativePlatform:()=>true,Plugins:{LocalNotifications:plugin}},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},BizimSkorMobileHooks:{client:{rpc:async()=>pending}},addEventListener:()=>{},setTimeout:()=>{},setInterval:()=>{},console,Date};
 vm.runInNewContext(readFileSync(new URL('../native-reminders.js',import.meta.url),'utf8'),context);
 const refreshing=context.BizimSkorNativeReminders.refresh();await new Promise(r=>setImmediate(r));
 await context.BizimSkorNativeReminders.toggle();
 release({data:[{competition:'super',week:12,fixture_count:9,saved_count:0,deadline:new Date(Date.now()+7200000).toISOString()}]});await refreshing;
 assert.equal(values.has('bizimSkorNativeReminders'),false);assert.ok(!calls.includes('schedule'));
});
for(const action of ['disable','logout'])test(`${action} cancels existing alarms without waiting for a stalled status request`,async()=>{
 const {readFileSync}=await import('node:fs');const vm=await import('node:vm');
 const values=new Map([['bizimSkorFriendToken','token'],['bizimSkorNativeReminders','1']]);const events=new Map();
 const calls=[];let release,count=0;const held=new Promise(r=>release=r);
 const rows={data:[{competition:'super',week:12,fixture_count:9,saved_count:0,deadline:new Date(Date.now()+7200000).toISOString()}]};
 const plugin={checkPermissions:async()=>({display:'granted'}),cancel:async()=>calls.push('cancel'),schedule:async()=>calls.push('schedule'),addListener:()=>{}};
 const document={getElementById:()=>null,addEventListener:()=>{},visibilityState:'visible'};
 const context={document,Capacitor:{isNativePlatform:()=>true,Plugins:{LocalNotifications:plugin}},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},BizimSkorMobileHooks:{client:{rpc:async()=>++count===1?rows:held}},addEventListener:(n,f)=>events.set(n,f),setTimeout:()=>{},setInterval:()=>{},console,Date};
 vm.runInNewContext(readFileSync(new URL('../native-reminders.js',import.meta.url),'utf8'),context);
 const api=context.BizimSkorNativeReminders;await api.refresh();assert.ok(values.has('bizimSkorNativeReminderIds'));calls.length=0;
 const waiting=api.refresh();await new Promise(r=>setImmediate(r));
 if(action==='disable')await api.toggle();else{values.delete('bizimSkorFriendToken');await events.get('bizimskor:logged-out')()}
 assert.ok(calls.includes('cancel'),'old alarms must cancel before network response');assert.equal(values.has('bizimSkorNativeReminderIds'),false);
 release(rows);await waiting;assert.ok(!calls.includes('schedule'));
});

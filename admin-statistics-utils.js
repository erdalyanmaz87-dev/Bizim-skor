(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorAdminStatisticsUtils=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const day=(v,tz='Europe/Istanbul')=>v?new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v)):'';
 function summarize(rows=[],today){const total=rows.length,completed=rows.filter(x=>x.prediction_complete).length,seen=rows.filter(x=>x.reminder==='yes'||x.reminder==='later').length;return{activeToday:rows.filter(x=>day(x.last_seen)===today).length,newToday:rows.filter(x=>day(x.registered_at)===today).length,completed,incomplete:total-completed,reminderSeen:seen,reminderYes:rows.filter(x=>x.reminder==='yes').length,reminderLater:rows.filter(x=>x.reminder==='later').length,reminderConverted:rows.filter(x=>x.reminder_completed).length,participation:total?Math.round(completed*100/total):0}}
 function attention(rows=[],today){return rows.filter(x=>day(x.last_seen)===today&&!x.prediction_complete)}
 function formatClock(value,tz='Europe/Istanbul'){return value?new Intl.DateTimeFormat('tr-TR',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)): '—'}
 return Object.freeze({summarize,attention,formatClock});
});

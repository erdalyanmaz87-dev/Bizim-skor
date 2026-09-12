(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorSuperLeagueOneTimeUnlock=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
let grant=false,original=null;
function shouldBypassLock({baseLocked,grant,week}){return !!baseLocked&&!!grant&&Number(week)===5}
function patch(){const util=root.BizimSkorTwoWeek;if(!util||typeof util.is
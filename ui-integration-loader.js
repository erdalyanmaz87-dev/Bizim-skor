(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorUIIntegration=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
const scripts=['week-strip.js','header-ui.js','horizontal-menu.js','prediction-week-cards.js','weekly-ranking-strip.js','fixture-week-strip.js','history-week-strip.js'];
function scriptOrder(){return scripts.slice()}
function loadScript(src){return new Promise((resolve,reject)=>{if(document.querySelector(`script[data-bizim-ui="${src}"]`))return resolve();const s=document.createElement('script');s.src=src;s.defer=true;s.dataset.bizimUi=src;s.onload=resolve;s.onerror=()=>reject(new Error(`${src} yüklenemedi`));document.body.appendChild(s)})}
async function loadAll(){for(const src of scripts)await loadScript(src)}
function exposeCore(){try{if(typeof sb!=='undefined')root.sb=sb}catch(_){}try{if(typeof selectedPredictionWeek!=='undefined')root.selectedPredictionWeek=selectedPredictionWeek}catch(_){}try{if(typeof loadWeeklyRanking==='function')root.loadWeeklyRanking=loadWeeklyRanking}catch(_){}try{if(typeof renderFixtureWeek==='function')root.renderFixtureWeek=renderFixtureWeek}catch(_){}try{if(typeof renderHistoryWeek==='function')root.renderHistoryWeek=renderHistoryWeek}catch(_){} }
function mount(){if(typeof document==='undefined')return;const start=()=>{exposeCore();loadAll().catch(e=>console.warn('ui integration',e))};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()}
return Object.freeze({scriptOrder,loadAll,exposeCore,mount});
});

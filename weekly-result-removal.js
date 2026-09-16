(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorWeeklyResultRemoval=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(){
function removeWeeklyResultUi(doc){if(!doc?.querySelectorAll)return 0;const nodes=[...doc.querySelectorAll('[data-simple-account="weeklyResult"],#bsWeeklyResultCardShell,#bsWeeklyResultTrigger')];nodes.forEach(node=>node.remove?.());return nodes.length;}
function mount(doc=typeof document!=='undefined'?document:null){if(!doc)return false;const run=()=>removeWeeklyResultUi(doc);run();if(typeof MutationObserver!=='undefined'){const observer=new MutationObserver(run);observer.observe(doc.body,{childList:true,subtree:true});doc.__bsWeeklyResultRemovalObserver=observer;}return true;}
return Object.freeze({removeWeeklyResultUi,mount});
});

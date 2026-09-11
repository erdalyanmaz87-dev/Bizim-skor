(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorScreenNavigationAdapter=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
const modules=['screen-navigation-app.js','screen-nav-profile-hook.js','screen-nav-support-card.js','screen-nav-support-hook.js'];
function loadScript(src,doc){return new Promise((resolve,reject)=>{if(doc.querySelector?.(`script[data-bs-nav-module="${src}"]`))return resolve();const existing=[...(doc.scripts||[])].find(s=>(s.getAttribute?.('src')||'').split('?')[0].endsWith(src));if(existing)return resolve();const node=doc.createElement('script');node.src=src;node.defer=true;node.dataset.bsNavModule=src;node.onload=resolve;node.onerror=()=>reject(new Error(`${src} yüklenemedi`));doc.body.appendChild(node)})}
async function mount(doc=typeof document!=='undefined'?document:null){if(!doc)return false;for(const src of modules)await loadScript(src,doc);return true}
return Object.freeze({modules,loadScript,mount});
});

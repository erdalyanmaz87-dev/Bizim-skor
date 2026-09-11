(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorSupportEntry=api;api.autoMount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const scripts=['support-inbox-utils.js','support-admin-utils.js','support-api.js','support-player-controller.js','support-admin-controller.js','support-player-view.js','support-admin-view.js','support-placement.js','support-admin-placement.js','support-player-ui.js','support-admin-ui.js','support-bootstrap.js'];
  const css='support-inbox.css';
  let starting=null,watchTimer=null,lastGameToken=null;
  function scriptOrder(){return scripts.slice()}
  function styleHref(){return css}
  function gameToken(){return String(root?.localStorage?.getItem?.('bizimSkorFriendToken')||'')}
  function cleanupUi(doc=root?.document){
    if(!doc?.getElementById)return;
    ['openSupportInbox','openSupportAdmin','supportPlayerModal','supportAdminModal'].forEach(id=>doc.getElementById(id)?.remove?.());
  }
  function loadStyle(doc=root?.document){
    if(!doc||doc.querySelector?.('link[data-bizim-support-style]'))return;
    const link=doc.createElement('link');link.rel='stylesheet';link.href=css;link.dataset.bizimSupportStyle='1';doc.head.appendChild(link);
  }
  function loadScript(src,doc=root?.document){
    if(!doc)return Promise.resolve();
    if(doc.querySelector?.(`script[data-bizim-support="${src}"]`))return Promise.resolve();
    const existing=[...(doc.scripts||[])].find(s=>(s.getAttribute?.('src')||'').split('?')[0].endsWith(src));
    if(existing)return Promise.resolve();
    return new Promise((resolve,reject)=>{const node=doc.createElement('script');node.src=src;node.defer=true;node.dataset.bizimSupport=src;node.onload=resolve;node.onerror=()=>reject(new Error(`${src} yüklenemedi`));doc.body.appendChild(node)});
  }
  async function start(){
    if(starting)return starting;
    starting=(async()=>{loadStyle();for(const src of scripts)await loadScript(src);const bootstrap=root?.BizimSkorSupportBootstrap?.createSupportBootstrap?.(root);return bootstrap?bootstrap.mount():{mounted:false,reason:'missing-bootstrap'}})();
    try{return await starting}finally{starting=null}
  }
  async function restart(){cleanupUi();return start()}
  function watchSession(){
    if(watchTimer||typeof root?.setInterval!=='function')return;
    lastGameToken=gameToken();
    watchTimer=root.setInterval(()=>{
      const current=gameToken();
      if(current===lastGameToken)return;
      lastGameToken=current;
      restart().catch(error=>console.warn('support inbox remount',error));
    },1000);
  }
  function autoMount(){
    if(typeof window==='undefined'||typeof document==='undefined')return;
    const run=()=>start().catch(error=>console.warn('support inbox',error));
    if(document.readyState==='complete')setTimeout(run,600);else window.addEventListener('load',()=>setTimeout(run,600),{once:true});
    window.addEventListener('bizimskor:session-ready',()=>setTimeout(()=>restart().catch(error=>console.warn('support inbox remount',error)),80));
    watchSession();
  }
  return Object.freeze({scriptOrder,styleHref,gameToken,cleanupUi,loadStyle,loadScript,start,restart,watchSession,autoMount});
});

(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorTheme=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const STORAGE_KEY='bizimSkorTheme';
  const COLORS={light:'#071633',dark:'#020617'};
  let waitingForDocument=false,observerStarted=false;

  function normalizeTheme(value){return value==='dark'?'dark':'light'}
  function readTheme(storage=root?.localStorage){try{return normalizeTheme(storage?.getItem(STORAGE_KEY))}catch(_){return'light'}}
  function applyTheme(value,doc=typeof document!=='undefined'?document:null){
    const theme=normalizeTheme(value);
    if(!doc?.documentElement)return theme;
    doc.documentElement.dataset.theme=theme;
    const meta=doc.querySelector?.('meta[name="theme-color"]');
    if(meta){if(typeof meta.setAttribute==='function')meta.setAttribute('content',COLORS[theme]);else meta.content=COLORS[theme]}
    return theme;
  }
  function toggleMarkup(value){
    const theme=normalizeTheme(value),dark=theme==='dark';
    return `<button id="bsThemeToggle" class="bs-theme-toggle" type="button" role="switch" aria-checked="${dark}" aria-pressed="${dark}" aria-label="${dark?'Açık moda geç':'Koyu moda geç'}"><span class="bs-theme-choice${dark?'':' is-active'}">☀️ Açık</span><span class="bs-theme-track" aria-hidden="true"><span class="bs-theme-thumb"></span></span><span class="bs-theme-choice${dark?' is-active':''}">🌙 Koyu</span></button>`;
  }
  function changeTheme(current,storage=root?.localStorage,doc=typeof document!=='undefined'?document:null){
    const next=normalizeTheme(current)==='dark'?'light':'dark';
    try{storage?.setItem(STORAGE_KEY,next)}catch(_){}
    return applyTheme(next,doc);
  }
  function renderToggle(host,storage,doc){
    const current=applyTheme(readTheme(storage),doc);
    host.innerHTML=toggleMarkup(current);
    host.querySelector?.('#bsThemeToggle')?.addEventListener('click',()=>{
      changeTheme(doc.documentElement.dataset.theme,storage,doc);
      renderToggle(host,storage,doc);
    });
    return current;
  }
  function ensureHeaderHost(doc,storage){
    const user=doc?.querySelector?.('.bs-header-user'),account=doc?.querySelector?.('.bs-header-account');
    if(!user||!account)return false;
    let host=doc.getElementById('bsHeaderThemeHost');
    if(!host){host=doc.createElement('div');host.id='bsHeaderThemeHost';host.className='bs-theme-host bs-theme-header-host';account.insertBefore(host,user)}
    const original=doc.getElementById('conn');if(original&&original!==host)original.innerHTML='';
    if(!host.querySelector('#bsThemeToggle'))renderToggle(host,storage,doc);
    return true;
  }
  function mount(doc=typeof document!=='undefined'?document:null,storage=root?.localStorage){
    if(!doc)return false;
    applyTheme(readTheme(storage),doc);
    if(ensureHeaderHost(doc,storage))return true;
    const host=doc.getElementById?.('conn');
    if(host){host.className='bs-theme-host';renderToggle(host,storage,doc)}
    if(!observerStarted&&doc.body&&typeof MutationObserver==='function'){
      observerStarted=true;
      new MutationObserver(()=>ensureHeaderHost(doc,storage)).observe(doc.body,{childList:true,subtree:true});
    }
    if(!waitingForDocument&&doc.addEventListener){waitingForDocument=true;doc.addEventListener('DOMContentLoaded',()=>{waitingForDocument=false;mount(doc,storage)},{once:true})}
    return !!host;
  }
  function showConnectionError(message,doc=typeof document!=='undefined'?document:null){
    if(!doc)return false;
    let error=doc.getElementById?.('bsConnectionError');
    if(!error){error=doc.createElement('div');error.id='bsConnectionError';error.className='bs-connection-error';const anchor=doc.getElementById('bsConnectionShareRow')||doc.getElementById('conn');anchor?.insertAdjacentElement('afterend',error)}
    error.textContent='Bağlantı hatası: '+String(message||'Bilinmeyen hata');
    return true;
  }
  return Object.freeze({normalizeTheme,readTheme,applyTheme,toggleMarkup,changeTheme,renderToggle,ensureHeaderHost,mount,showConnectionError});
});

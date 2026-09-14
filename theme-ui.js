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
  function adminLegacyHideCss(){return '#openAdminStatistics,#openSupportAdmin{display:none!important}'}
  function ensureExtraStyles(doc){
    if(!doc||doc.getElementById('bsThemeHeaderMenuStyles'))return;
    const style=doc.createElement('style');style.id='bsThemeHeaderMenuStyles';style.textContent='.bs-theme-header-host{display:flex!important;align-items:center!important;margin-right:4px!important}.bs-theme-header-host .bs-theme-toggle{transform:scale(.78);transform-origin:right center;margin:0!important}'+adminLegacyHideCss()+'.bs-simple-admin-group{border-top:2px solid #dbeafe!important;margin-top:8px;padding-top:14px!important}.bs-simple-admin-group h3{color:#1d4ed8!important}@media(max-width:430px){.bs-theme-header-host .bs-theme-toggle{transform:scale(.66)}}';doc.head.appendChild(style)
  }
  function ensureAdminMenu(doc){
    if(!doc?.getElementById('openSupportAdmin'))return false;
    const content=doc.querySelector('#bsSimpleNavDrawer .bs-simple-content');
    if(!content||doc.getElementById('bsSimpleAdminMenu'))return false;
    const section=doc.createElement('section');section.id='bsSimpleAdminMenu';section.className='bs-simple-group bs-simple-admin-group';section.innerHTML='<h3>Yönetici</h3><button type="button" class="bs-simple-row" data-admin-menu="summary"><span aria-hidden="true">📊</span><b>Yönetici Özeti</b><span class="bs-simple-chevron" aria-hidden="true">›</span></button><button type="button" class="bs-simple-row" data-admin-menu="inbox"><span aria-hidden="true">📥</span><b>Gelen Kutusu</b><span class="bs-simple-chevron" aria-hidden="true">›</span></button>';content.appendChild(section);
    section.querySelector('[data-admin-menu="summary"]')?.addEventListener('click',()=>{doc.getElementById('openAdminStatistics')?.click();doc.querySelector('#bsSimpleNavDrawer [data-simple-close]')?.click()});
    section.querySelector('[data-admin-menu="inbox"]')?.addEventListener('click',()=>{doc.getElementById('openSupportAdmin')?.click();doc.querySelector('#bsSimpleNavDrawer [data-simple-close]')?.click()});
    return true;
  }
  function ensurePredictionCompetitionScript(doc){
    if(!doc)return false;
    if(root?.BizimSkorPredictionCompetitionNav){root.BizimSkorPredictionCompetitionNav.mount?.(doc);return true}
    if(doc.getElementById('bsPredictionCompetitionScript'))return true;
    const script=doc.createElement('script');script.id='bsPredictionCompetitionScript';script.src='prediction-competition-nav.js';script.defer=true;script.onload=()=>root?.BizimSkorPredictionCompetitionNav?.mount?.(doc);doc.head.appendChild(script);return true;
  }
  function mount(doc=typeof document!=='undefined'?document:null,storage=root?.localStorage){
    if(!doc)return false;
    applyTheme(readTheme(storage),doc);ensureExtraStyles(doc);ensurePredictionCompetitionScript(doc);
    const headerReady=ensureHeaderHost(doc,storage);
    const host=doc.getElementById?.('conn');
    if(!headerReady&&host){host.className='bs-theme-host';renderToggle(host,storage,doc)}
    ensureAdminMenu(doc);
    if(!observerStarted&&doc.body&&typeof MutationObserver==='function'){
      observerStarted=true;
      new MutationObserver(()=>{ensureHeaderHost(doc,storage);ensureAdminMenu(doc)}).observe(doc.body,{childList:true,subtree:true});
    }
    if(!waitingForDocument&&doc.addEventListener){waitingForDocument=true;doc.addEventListener('DOMContentLoaded',()=>{waitingForDocument=false;mount(doc,storage)},{once:true})}
    return headerReady||!!host;
  }
  function showConnectionError(message,doc=typeof document!=='undefined'?document:null){
    if(!doc)return false;
    let error=doc.getElementById?.('bsConnectionError');
    if(!error){error=doc.createElement('div');error.id='bsConnectionError';error.className='bs-connection-error';const anchor=doc.getElementById('bsConnectionShareRow')||doc.getElementById('conn');anchor?.insertAdjacentElement('afterend',error)}
    error.textContent='Bağlantı hatası: '+String(message||'Bilinmeyen hata');
    return true;
  }
  return Object.freeze({normalizeTheme,readTheme,applyTheme,toggleMarkup,changeTheme,renderToggle,ensureHeaderHost,adminLegacyHideCss,ensureAdminMenu,ensurePredictionCompetitionScript,mount,showConnectionError});
});

(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorHeaderUI=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const esc=value=>String(value??'').replace(/[&<>'\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[char]));
  function headerAccountState(name){
    const clean=String(name||'').trim();
    return clean
      ? {loggedIn:true,name:clean,action:'Çıkış Yap'}
      : {loggedIn:false,name:'',action:'Giriş Yap'};
  }
  function buildHeaderMarkup(name){
    const state=headerAccountState(name);
    return `<div class="bs-header-brand"><img class="bs-header-logo" src="bizim-skor-logo-v2.png" alt="Bizim Skor — Sezonluk Arkadaş Ligi"></div><div class="bs-header-account">${state.loggedIn?`<span class="bs-header-user">👤 ${esc(state.name)}</span>`:''}<button id="bsHeaderAccountAction" type="button">${state.action}</button></div>`;
  }
  function ensureStyles(){
    if(typeof document==='undefined'||document.getElementById('bsHeaderStyles'))return;
    document.head.insertAdjacentHTML('beforeend','<style id="bsHeaderStyles">.h.bs-modern-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;text-align:left;min-height:72px}.bs-header-brand{min-width:0;flex:1}.bs-header-logo{display:block;width:min(230px,100%);height:auto;max-height:82px;object-fit:contain;object-position:left center}.bs-header-account{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.bs-header-user{font-size:13px;font-weight:900;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bs-header-account button{background:#fff;color:#0f172a;border:1px solid #cbd5e1;padding:9px 11px;border-radius:10px;font-size:12px}.bs-header-account button:active{transform:translateY(1px)}@media(max-width:430px){.h.bs-modern-header{align-items:center}.bs-header-logo{width:min(180px,100%);max-height:66px}.bs-header-account{max-width:145px}.bs-header-user{max-width:120px;font-size:12px}.bs-header-account button{padding:8px 9px}}</style>');
  }
  function refresh(){
    if(typeof document==='undefined')return;
    const header=document.querySelector('.h');
    if(!header)return;
    const name=root?.localStorage?.getItem('bizimSkorName')||'';
    header.classList.add('bs-modern-header');
    header.innerHTML=buildHeaderMarkup(name);
    const action=document.getElementById('bsHeaderAccountAction');
    if(!action)return;
    action.addEventListener('click',()=>{
      const state=headerAccountState(root?.localStorage?.getItem('bizimSkorName'));
      if(state.loggedIn){
        document.getElementById('logoutPlayer')?.click();
        setTimeout(refresh,80);
        return;
      }
      document.querySelector('[data-tab="home"]')?.click();
      document.getElementById('showLogin')?.click();
      document.getElementById('newPlayer')?.scrollIntoView?.({behavior:'smooth',block:'center'});
      document.getElementById('loginName')?.focus?.();
    });
  }
  function mount(){
    if(typeof document==='undefined')return;
    ensureStyles();
    refresh();
    const targets=[document.getElementById('knownPlayer'),document.getElementById('newPlayer'),document.getElementById('knownName')].filter(Boolean);
    if(typeof MutationObserver==='function'&&targets.length){
      const observer=new MutationObserver(()=>setTimeout(refresh,0));
      targets.forEach(target=>observer.observe(target,{attributes:true,childList:true,subtree:true,attributeFilter:['class']}));
    }
    root?.addEventListener?.('focus',refresh);
  }
  return Object.freeze({headerAccountState,buildHeaderMarkup,refresh,mount});
});

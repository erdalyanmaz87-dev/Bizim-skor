(function(root){
  function app(){return root.BizimSkorScreenNavigationRuntime}
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.__bsNavSupportHook)return false;doc.__bsNavSupportHook=true;
    doc.addEventListener('click',event=>{
      if(event.target?.closest?.('#openSupportInbox')){
        root.setTimeout?.(()=>app()?.openDetail?.('supportPlayer',{title:'Bize Ulaşın',onClose:()=>doc.getElementById('supportPlayerModal')?.classList.add('hide')}),0);return;
      }
      if(event.target?.closest?.('#openSupportAdmin')){
        root.setTimeout?.(()=>app()?.openDetail?.('supportAdmin',{title:'Gelen Kutusu',onClose:()=>doc.getElementById('supportAdminModal')?.classList.add('hide')}),0);return;
      }
      if(event.target?.closest?.('[data-support-close]')&&app()?.snapshot?.().detailId==='supportPlayer'){root.setTimeout?.(()=>app()?.back?.(),0);return}
      if(event.target?.closest?.('[data-support-admin-close]')&&app()?.snapshot?.().detailId==='supportAdmin')root.setTimeout?.(()=>app()?.back?.(),0);
    });
    return true;
  }
  const api=Object.freeze({mount});
  if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorScreenNavSupportHook=api;api.mount()}
})(typeof globalThis!=='undefined'?globalThis:this);

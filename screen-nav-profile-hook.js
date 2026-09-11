(function(root){
  function app(){return root.BizimSkorScreenNavigationRuntime}
  function mount(doc){
    if(!doc||doc.__bsNavProfileHook)return false;
    doc.__bsNavProfileHook=true;
    doc.addEventListener('click',event=>{
      const link=event.target?.closest?.('.bs-player-profile-link');
      if(link){
        const name=String(link.dataset?.playerName||'Oyuncu');
        root.setTimeout(()=>app()?.openDetail?.('playerProfile',{title:name,context:{playerName:name,week:link.dataset?.profileWeek||null,kind:link.dataset?.profileKind||null},onClose:()=>doc.getElementById('bsPlayerProfileModal')?.classList.add('hide')}),0);
        return;
      }
      const close=event.target?.closest?.('[data-player-profile-close]');
      if(close&&app()?.snapshot?.().detailId==='playerProfile')root.setTimeout(()=>app()?.back?.(),0);
    });
    return true;
  }
  const api=Object.freeze({mount});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorScreenNavProfileHook=api;api.mount(document)}
})(typeof globalThis!=='undefined'?globalThis:this);

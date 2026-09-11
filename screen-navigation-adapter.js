(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorScreenNavigationAdapter=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
function detailForElement(el){
  if(!el?.matches)return null;
  if(el.matches('.bs-player-profile-link'))return{id:'playerProfile',title:String(el.dataset?.playerName||'Oyuncu Profili'),context:{name:String(el.dataset?.playerName||''),week:el.dataset?.profileWeek?+el.dataset.profileWeek:null,kind:el.dataset?.profileKind||null}};
  if(el.matches('#openSupportInbox'))return{id:'supportPlayer',title:'Bize Ulaşın',context:null};
  if(el.matches('#openSupportAdmin'))return{id:'supportAdmin',title:'Gelen Kutusu',context:null};
  return null;
}
function hideById(doc,id){doc?.getElementById?.(id)?.classList?.add?.('hide')}
function mount(doc=typeof document!=='undefined'?document:null){
  if(!doc)return;
  const nav=()=>root.BizimSkorScreenNavigationUI;
  nav()?.registerDetail?.('playerProfile',()=>hideById(doc,'bsPlayerProfileModal'));
  nav()?.registerDetail?.('supportPlayer',()=>hideById(doc,'supportPlayerModal'));
  nav()?.registerDetail?.('supportAdmin',()=>hideById(doc,'supportAdminModal'));
  doc.addEventListener('click',event=>{
    const target=event.target?.closest?.('.bs-player-profile-link,#openSupportInbox,#openSupportAdmin');
    const detail=detailForElement(target);
    if(detail)setTimeout(()=>nav()?.openDetail?.(detail.id,detail.title,detail.context,doc),0);
  });
  doc.addEventListener('click',event=>{
    const close=event.target?.closest?.('[data-player-profile-close],[data-support-close],[data-support-admin-close]');
    if(close)nav()?.back?.(doc);
  },true);
}
return Object.freeze({detailForElement,hideById,mount});
});

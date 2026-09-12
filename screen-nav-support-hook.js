(function(root){
  function app(){return root.BizimSkorScreenNavigationRuntime}
  function visible(doc,id){const node=doc?.getElementById?.(id);return !!node&&!node.classList?.contains?.('hide')}
  function syncOpenDetail(doc){
    const runtime=app();if(!runtime)return false;const current=runtime.snapshot?.().detailId;
    if(visible(doc,'supportAdminModal')&&current!=='supportAdmin'){runtime.openDetail?.('supportAdmin',{title:'Gelen Kutusu',onClose:()=>doc.getElementById('supportAdminModal')?.classList.add('hide')});return true}
    if(visible(doc,'supportPlayerModal')&&current!=='supportPlayer'){runtime.openDetail?.('supportPlayer',{title:'Bize Ulaşın',onClose:()=>doc.getElementById('supportPlayerModal')?.classList.add('hide')});return true}
    return false;
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.__bsNavSupportHook)return false;doc.__bsNavSupportHook=true;
    const sync=()=>syncOpenDetail(doc);sync();
    if(typeof MutationObserver!=='undefined')new MutationObserver(sync).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    doc.addEventListener('click',event=>{
      if(event.target?.closest?.('[data-support-close]')&&app()?.snapshot?.().detailId==='supportPlayer'){root.setTimeout?.(()=>app()?.back?.(),0);return}
      if(event.target?.closest?.('[data-support-admin-close]')&&app()?.snapshot?.().detailId==='supportAdmin')root.setTimeout?.(()=>app()?.back?.(),0);
    });
    return true;
  }
  const api=Object.freeze({visible,syncOpenDetail,mount});
  if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorScreenNavSupportHook=api;api.mount()}
})(typeof globalThis!=='undefined'?globalThis:this);

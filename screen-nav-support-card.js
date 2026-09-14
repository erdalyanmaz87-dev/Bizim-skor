(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorScreenNavSupportCard=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const LEGACY_IDS=['bsSupportHomeCard','bsAdminInboxCard'];
  function cardDefinitions(){return[]}
  function addCard(){return false}
  function sync(doc){
    LEGACY_IDS.forEach(id=>doc?.getElementById?.(id)?.remove?.());
    return[];
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.__bsSupportCardWatch)return false;doc.__bsSupportCardWatch=true;
    sync(doc);
    root.setTimeout?.(()=>sync(doc),1200);
    root.setTimeout?.(()=>sync(doc),3000);
    root.addEventListener?.('bizimskor:session-ready',()=>root.setTimeout?.(()=>sync(doc),200));
    return true;
  }
  return Object.freeze({cardDefinitions,addCard,sync,mount});
});

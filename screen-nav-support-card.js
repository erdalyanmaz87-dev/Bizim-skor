(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorScreenNavSupportCard=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function cardDefinitions(){return[
    {id:'bsSupportHomeCard',sourceId:'openSupportInbox',className:'support-contact',label:'📩 Bize Ulaşın',eyebrow:'Destek'},
    {id:'bsAdminInboxCard',sourceId:'openSupportAdmin',className:'admin-inbox',label:'📬 Gelen Kutusu',eyebrow:'Yönetim'}
  ]}
  function addCard(doc,def){
    const trigger=doc?.getElementById?.(def.sourceId),wrap=doc?.querySelector?.('#bsHomeDashboard .bs-home-stats');
    const existing=doc?.getElementById?.(def.id);
    if(!trigger||!wrap){existing?.remove?.();return false}
    if(existing)return true;
    const card=doc.createElement('button');card.id=def.id;card.type='button';card.className=`bs-home-stat ${def.className}`;card.innerHTML=`<span>${def.eyebrow}</span><b>${def.label}</b>`;card.addEventListener('click',()=>doc.getElementById(def.sourceId)?.click?.());wrap.appendChild(card);return true;
  }
  function sync(doc){return cardDefinitions().map(def=>addCard(doc,def))}
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.__bsSupportCardWatch)return false;doc.__bsSupportCardWatch=true;
    const refresh=()=>sync(doc);refresh();root.setTimeout?.(refresh,1200);root.setTimeout?.(refresh,3000);root.addEventListener?.('bizimskor:session-ready',()=>root.setTimeout?.(refresh,200));
    if(typeof MutationObserver!=='undefined')new MutationObserver(()=>refresh()).observe(doc.body,{childList:true,subtree:true});
    return true;
  }
  return Object.freeze({cardDefinitions,addCard,sync,mount});
});

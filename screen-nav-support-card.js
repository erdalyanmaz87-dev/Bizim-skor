(function(root){
  function addCard(doc){
    const trigger=doc?.getElementById?.('openSupportAdmin');
    const wrap=doc?.querySelector?.('#bsHomeDashboard .bs-home-stats');
    if(!trigger||!wrap)return false;
    if(doc.getElementById('bsAdminInboxCard'))return true;
    const card=doc.createElement('button');
    card.id='bsAdminInboxCard';card.type='button';card.className='bs-home-stat admin-inbox';
    card.innerHTML='<span>Yönetim</span><b>📬 Gelen Kutusu</b>';
    card.addEventListener('click',()=>trigger.click());
    wrap.appendChild(card);return true;
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.__bsInboxCardWatch)return false;doc.__bsInboxCardWatch=true;
    const sync=()=>addCard(doc);sync();root.setTimeout?.(sync,1200);root.setTimeout?.(sync,3000);root.addEventListener?.('bizimskor:session-ready',()=>root.setTimeout?.(sync,200));
    if(typeof MutationObserver!=='undefined')new MutationObserver(()=>sync()).observe(doc.body,{childList:true,subtree:true});
    return true;
  }
  const api=Object.freeze({addCard,mount});
  if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorScreenNavSupportCard=api;api.mount()}
})(typeof globalThis!=='undefined'?globalThis:this);

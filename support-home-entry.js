(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorSupportHomeEntry=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
function ensureCard(doc,id,label,sourceId,className){
  const source=doc.getElementById(sourceId),home=doc.getElementById('home');
  let card=doc.getElementById(id);
  if(!source||!home){card?.remove?.();return false}
  if(!card){card=doc.createElement('button');card.id=id;card.type='button';card.className=`c bs-support-home-card ${className||''}`.trim();card.addEventListener('click',()=>doc.getElementById(sourceId)?.click?.());const dashboard=doc.getElementById('bsHomeDashboard');if(dashboard)dashboard.insertAdjacentElement('afterend',card);else home.prepend(card)}
  card.innerHTML=`<b>${label}</b><span>Mesajları aç</span>`;
  return true;
}
function sync(doc=document){
  const player=ensureCard(doc,'bsSupportHomeCard','📩 Bize Ulaşın','openSupportInbox','player');
  const admin=ensureCard(doc,'bsAdminInboxHomeCard','📬 Gelen Kutusu','openSupportAdmin','admin');
  return{player,admin};
}
function ensureStyles(doc=document){if(doc.getElementById('bsSupportHomeStyles'))return;const style=doc.createElement('style');style.id='bsSupportHomeStyles';style.textContent='.bs-support-home-card{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;border:1px solid #bfdbfe;background:#eff6ff;color:#0f172a;cursor:pointer}.bs-support-home-card b{font-size:16px}.bs-support-home-card span{font-size:11px;color:#475569}.bs-support-home-card.admin{background:#fff7ed;border-color:#fdba74}.bs-support-home-card:active{transform:translateY(1px)}';doc.head.appendChild(style)}
function mount(doc=typeof document!=='undefined'?document:null){if(!doc)return;ensureStyles(doc);const refresh=()=>sync(doc);refresh();setTimeout(refresh,800);setTimeout(refresh,2200);if(typeof MutationObserver==='function')new MutationObserver(refresh).observe(doc.body,{childList:true,subtree:true})}
return Object.freeze({ensureCard,sync,ensureStyles,mount});
});

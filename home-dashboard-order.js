(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorHomeDashboardOrder=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(){
const ORDER=['champions','general','nations','league','rate'];
function reorderDashboard(doc){
  const d=doc||document,wrap=d.querySelector?.('#bsHomeDashboard .bs-home-stats');
  if(!wrap)return false;
  const cards=ORDER.map(kind=>wrap.querySelector?.(`.bs-home-stat.${kind}`)).filter(Boolean);
  if(cards.length!==ORDER.length)return false;
  cards.forEach(card=>wrap.appendChild(card));
  return true;
}
function mount(){
  if(typeof document==='undefined')return;
  const sync=()=>reorderDashboard(document);
  sync();
  setTimeout(sync,1000);setTimeout(sync,2500);setTimeout(sync,5500);
}
return Object.freeze({ORDER,reorderDashboard,mount});
});

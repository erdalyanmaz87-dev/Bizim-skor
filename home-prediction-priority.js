(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorHomePriority=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function prioritizeTabs(names){
    const rows=[...(names||[])],pred=rows.indexOf('pred');
    if(pred<0)return rows;
    rows.splice(pred,1);
    const homeNow=rows.indexOf('home');
    rows.splice(homeNow>=0?homeNow+1:0,0,'pred');
    return rows;
  }
  function ctaText(){return '⚽ TAHMİN YAP'}
  function ctaStatus(week,remaining,complete){
    const prefix=`Süper Lig • ${week}. Hafta • `;
    return prefix+(complete?'✅ Bu haftanın tahminleri tamamlandı':`${remaining} maç seni bekliyor →`);
  }
  function currentInfo(){
    const select=document.getElementById('predictionWeekSelect');
    const week=Number(select?.value)||null;
    if(!week)return null;
    let total=0,saved=0;
    try{if(typeof allFixtures!=='undefined')total=(allFixtures||[]).filter(f=>+f.week===week).length}catch(_){ }
    saved=document.querySelectorAll('#predictionState .savedrow').length;
    const complete=total>0&&saved===total;
    return{week,total,remaining:complete?0:Math.max(total-saved,0),complete};
  }
  function refresh(){
    const tab=document.querySelector('.tabs .tab[data-tab="pred"]');
    if(!tab)return;
    tab.innerHTML='<span class="pred-main">⚽ TAHMİN YAP</span><span class="pred-sub">Tahminlerini yapmak için dokun</span>';
    const info=currentInfo();
    if(info&&info.total)tab.querySelector('.pred-sub').textContent=ctaStatus(info.week,info.remaining,info.complete);
  }
  function mount(){
    const tabs=document.querySelector('.tabs'),pred=tabs?.querySelector('.tab[data-tab="pred"]'),home=tabs?.querySelector('.tab[data-tab="home"]');
    if(!tabs||!pred)return;
    if(home&&home.nextElementSibling!==pred)tabs.insertBefore(pred,home.nextSibling);
    pred.classList.add('prediction-primary-tab');
    if(!document.getElementById('predictionPriorityStyles'))document.head.insertAdjacentHTML('beforeend','<style id="predictionPriorityStyles">.tabs .prediction-primary-tab{flex:1 1 100%;order:0;min-height:68px;padding:12px 16px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;border:2px solid #60a5fa;box-shadow:0 8px 20px rgba(29,78,216,.22);text-align:left}.tabs .prediction-primary-tab.active{background:linear-gradient(135deg,#020b2d,#0b4fc3)}.prediction-primary-tab .pred-main{display:block;font-size:18px;font-weight:900;letter-spacing:.2px}.prediction-primary-tab .pred-sub{display:block;margin-top:4px;font-size:12px;font-weight:700;color:#dbeafe}</style>');
    refresh();
    setTimeout(refresh,700);setTimeout(refresh,1800);
    document.addEventListener('change',e=>{if(e.target?.id==='predictionWeekSelect')setTimeout(refresh,50)});
  }
  return{prioritizeTabs,ctaText,ctaStatus,mount,refresh};
});

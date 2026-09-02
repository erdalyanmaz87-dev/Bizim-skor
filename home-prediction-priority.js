(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorHomePriority=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function prioritizeTabs(names){const rows=[...(names||[])],pred=rows.indexOf('pred');if(pred<0)return rows;rows.splice(pred,1);const homeNow=rows.indexOf('home');rows.splice(homeNow>=0?homeNow+1:0,0,'pred');return rows}
  function ctaText(){return '⚽ TAHMİN YAP'}
  function weekStatus(week,saved,total){const complete=total>0&&saved>=total;return{week,complete,text:complete?`🟢 ${week}. Hafta tahminlerin tamamlandı ✓`:`🔴 ${week}. Hafta tahminini yapmadın →`}}
  function chooseStatus(rows){const pending=(rows||[]).find(x=>!x.complete);if(pending)return pending;if((rows||[]).length>1&&rows.every(x=>x.complete))return{text:'🟢 Tüm açık haftaların tahminleri tamamlandı ✓',complete:true};return rows?.[0]||null}
  async function getStatuses(){
    let weeks=[],fixtures=[];try{weeks=[...(visiblePredictionWeeks||[])];fixtures=[...(allFixtures||[])]}catch(_){return[]}
    const name=localStorage.getItem('bizimSkorName');if(!name||!weeks.length)return[];
    const q=await sb.from('predictions').select('week,fixture_id').eq('player_name',name).in('week',weeks);if(q.error)throw q.error;
    return weeks.map(week=>{const total=fixtures.filter(f=>+f.week===+week).length,saved=new Set((q.data||[]).filter(p=>+p.week===+week).map(p=>p.fixture_id)).size;return weekStatus(week,saved,total)})
  }
  async function refresh(){
    const tab=document.querySelector('.tabs .tab[data-tab="pred"]');if(!tab)return;
    tab.innerHTML='<span class="pred-content"><span class="pred-main">⚽ TAHMİN YAP</span><span class="pred-sub">Tahminlerini yapmak için dokun</span></span><span class="pred-arrow">›</span>';
    try{const status=chooseStatus(await getStatuses());if(status){const sub=tab.querySelector('.pred-sub');sub.textContent=status.text;sub.classList.toggle('pred-done',!!status.complete);sub.classList.toggle('pred-missing',!status.complete)}}catch(error){console.warn('prediction CTA status',error)}
  }
  function mount(){
    const tabs=document.querySelector('.tabs'),pred=tabs?.querySelector('.tab[data-tab="pred"]'),home=tabs?.querySelector('.tab[data-tab="home"]');if(!tabs||!pred)return;
    if(home&&home.nextElementSibling!==pred)tabs.insertBefore(pred,home.nextSibling);pred.classList.add('prediction-primary-tab');
    if(!document.getElementById('predictionPriorityStyles'))document.head.insertAdjacentHTML('beforeend','<style id="predictionPriorityStyles">.tabs .prediction-primary-tab{flex:1 1 100%;order:0;min-height:76px;padding:10px 14px;background:linear-gradient(180deg,#ffffff,#f8fafc);color:#0f172a;border:2px solid #0f172a;border-bottom-width:5px;box-shadow:0 5px 0 #cbd5e1,0 10px 20px rgba(15,23,42,.14);text-align:left;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;transform:translateY(0);transition:transform .12s,box-shadow .12s}.tabs .prediction-primary-tab:active{transform:translateY(3px);box-shadow:0 2px 0 #cbd5e1,0 5px 12px rgba(15,23,42,.12)}.tabs .prediction-primary-tab.active{background:linear-gradient(180deg,#fff,#eff6ff);color:#0f172a;border-color:#1d4ed8}.prediction-primary-tab .pred-content{min-width:0}.prediction-primary-tab .pred-main{display:block;font-size:19px;font-weight:900;letter-spacing:.2px}.prediction-primary-tab .pred-sub{display:inline-block;margin-top:6px;padding:5px 8px;border-radius:8px;font-size:12px;font-weight:900}.prediction-primary-tab .pred-missing{background:#fee2e2;color:#b91c1c}.prediction-primary-tab .pred-done{background:#dcfce7;color:#15803d}.prediction-primary-tab .pred-arrow{font-size:34px;line-height:1;font-weight:900;color:#1d4ed8}</style>');
    refresh();setTimeout(refresh,700);setTimeout(refresh,1800);document.addEventListener('change',e=>{if(e.target?.id==='predictionWeekSelect')setTimeout(refresh,50)});window.addEventListener('focus',refresh)
  }
  return{prioritizeTabs,ctaText,weekStatus,chooseStatus,mount,refresh};
});

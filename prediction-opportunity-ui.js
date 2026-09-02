(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.BizimSkorPredictionOpportunity=api;
    const apply=()=>{
      try{
        if(typeof selectedPredictionWeek==='undefined'||+selectedPredictionWeek!==5)return;
        const box=document.getElementById('fx');
        if(!box||typeof fixtures==='undefined')return;
        const rows=[...box.querySelectorAll('.m')];
        const index=api.findOpportunityIndex(fixtures,selectedPredictionWeek);
        if(index<0||!rows[index]||rows[index].querySelector('.prediction-opportunity-badge'))return;
        rows[index].insertAdjacentHTML('afterbegin',`<div class="prediction-opportunity-badge" style="grid-column:1/-1;margin:0 0 8px;padding:8px 10px;border-radius:10px;background:#fff7ed;border:1px solid #fb923c;color:#9a3412;text-align:center;font-weight:900;font-size:12px">🔥 FIRSAT MAÇI • X2 PUAN<div style="margin-top:3px;font-weight:700;font-size:11px">Doğru sonuç 2 • Tam skor 8 puan</div></div>`);
      }catch(error){console.warn('prediction opportunity badge',error)}
    };
    const observer=new MutationObserver(apply);
    window.addEventListener('load',()=>{const fx=document.getElementById('fx');if(fx)observer.observe(fx,{childList:true,subtree:true});apply()});
    document.addEventListener('change',event=>{if(event.target?.id==='predictionWeekSelect')setTimeout(apply,0)});
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function isOpportunity(fixture,week){return +week===5&&+fixture?.week===5&&+fixture?.id===44}
  function findOpportunityIndex(fixtures,week){return (fixtures||[]).findIndex(f=>isOpportunity(f,week))}
  function badgeDetail(fixture){return isOpportunity(fixture,5)?'Doğru sonuç 2 • Tam skor 8 puan':''}
  return{isOpportunity,findOpportunityIndex,badgeDetail};
});

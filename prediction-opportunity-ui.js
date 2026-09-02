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
        const row=rows[index];
        if(index<0||!row)return;
        const hasInline=!!row.querySelector('.prediction-opportunity-inline');
        const next=row.nextElementSibling;
        const hasDetail=!!(next&&next.classList.contains('prediction-opportunity-detail'));
        if(!api.shouldDecorate(hasInline,hasDetail))return;
        const away=row.querySelector('.t:last-child');
        if(away&&!hasInline){
          away.insertAdjacentHTML('beforeend',' <span class="prediction-opportunity-inline" style="display:inline-block;margin-left:6px;padding:2px 6px;border-radius:999px;background:#f97316;color:#fff;font-size:10px;font-weight:900;vertical-align:1px">X2</span>');
        }
        if(!hasDetail){
          row.insertAdjacentHTML('afterend','<div class="prediction-opportunity-detail" style="margin:-2px 0 8px;padding:6px 8px;border-radius:9px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;text-align:center;font-size:11px;font-weight:800">🔥 Fırsat Maçı • Doğru sonuç 2 puan • Tam skor 8 puan</div>');
        }
      }catch(error){console.warn('prediction opportunity badge',error)}
    };
    const observer=new MutationObserver(apply);
    window.addEventListener('load',()=>{const fx=document.getElementById('fx');if(fx)observer.observe(fx,{childList:true,subtree:true});apply()});
    document.addEventListener('change',event=>{if(event.target?.id==='predictionWeekSelect')setTimeout(apply,0)});
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function isOpportunity(fixture,week){return +week===5&&+fixture?.week===5&&+fixture?.id===44}
  function findOpportunityIndex(fixtures,week){return (fixtures||[]).findIndex(f=>isOpportunity(f,week))}
  function opportunityLayout(fixture){
    return isOpportunity(fixture,5)
      ?{badge:'X2',detail:'🔥 Fırsat Maçı • Doğru sonuç 2 puan • Tam skor 8 puan'}
      :{badge:'',detail:''};
  }
  function shouldDecorate(hasInline,hasDetail){return !(hasInline&&hasDetail)}
  return{isOpportunity,findOpportunityIndex,opportunityLayout,shouldDecorate};
});

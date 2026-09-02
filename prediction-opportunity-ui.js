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
        const next=row.nextElementSibling;
        const hasDetail=!!(next&&next.classList.contains('prediction-opportunity-detail'));
        const hasHighlight=row.classList.contains('prediction-opportunity-match');
        if(!api.shouldDecorate(hasHighlight,hasDetail))return;
        if(!hasHighlight){
          row.classList.add('prediction-opportunity-match');
          row.style.background='linear-gradient(180deg,#fff7ed,#ffedd5)';
          row.style.border='2px solid #fb923c';
          row.style.borderRadius='12px';
          row.style.padding='10px 8px';
          row.style.boxShadow='0 4px 12px rgba(249,115,22,.14)';
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
      ?{badge:'',highlight:true,detail:'🔥 Fırsat Maçı • Doğru sonuç 2 puan • Tam skor 8 puan'}
      :{badge:'',highlight:false,detail:''};
  }
  function shouldDecorate(hasHighlight,hasDetail){return !(hasHighlight&&hasDetail)}
  return{isOpportunity,findOpportunityIndex,opportunityLayout,shouldDecorate};
});

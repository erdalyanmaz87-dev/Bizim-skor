(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.BizimSkorPredictionOpportunity=api;
    const styleRow=row=>{row.classList.add('prediction-opportunity-match');row.style.background='linear-gradient(180deg,#fff7ed,#ffedd5)';row.style.border='2px solid #fb923c';row.style.borderRadius='12px';row.style.padding='10px 8px';row.style.boxShadow='0 4px 12px rgba(249,115,22,.14)'};
    const detail=()=>'<div class="prediction-opportunity-detail" style="margin:-2px 0 8px;padding:6px 8px;border-radius:9px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;text-align:center;font-size:11px;font-weight:800">🔥 Fırsat Maçı • Doğru sonuç 2 puan • Tam skor 8 puan</div>';
    const apply=()=>{
      try{
        if(typeof selectedPredictionWeek==='undefined'||+selectedPredictionWeek!==5)return;
        const box=document.getElementById('fx');if(!box)return;
        const matchRows=[...box.querySelectorAll('.m')];
        if(matchRows.length&&typeof fixtures!=='undefined'){
          const index=api.findOpportunityIndex(fixtures,selectedPredictionWeek),row=matchRows[index];
          if(row&&!row.classList.contains('prediction-opportunity-match'))styleRow(row);
          if(row&&!(row.nextElementSibling?.classList.contains('prediction-opportunity-detail')))row.insertAdjacentHTML('afterend',detail());
          return;
        }
        const savedRows=[...box.querySelectorAll('.savedrow')];
        const savedIndex=typeof fixtures!=='undefined'?api.findOpportunityIndex(fixtures,selectedPredictionWeek):-1;
        const savedRow=savedRows[savedIndex];
        if(savedRow&&!savedRow.classList.contains('prediction-opportunity-match'))styleRow(savedRow);
        if(savedRow&&!(savedRow.nextElementSibling?.classList.contains('prediction-opportunity-detail')))savedRow.insertAdjacentHTML('afterend',detail());
      }catch(error){console.warn('prediction opportunity badge',error)}
    };
    const observer=new MutationObserver(apply);
    const mount=()=>{const fx=document.getElementById('fx');if(fx)observer.observe(fx,{childList:true,subtree:true});apply()};
    if(document.readyState==='complete')mount();else window.addEventListener('load',mount);
    document.addEventListener('change',event=>{if(event.target?.id==='predictionWeekSelect')setTimeout(apply,0)});
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function isOpportunity(fixture,week){return +week===5&&+fixture?.week===5&&+(fixture?.id??fixture?.fixture_id)===44}
  function findOpportunityIndex(fixtures,week){return (fixtures||[]).findIndex(f=>isOpportunity(f,week))}
  function savedRowOpportunity(row){return +row?.week===5&&+(row?.fixture_id??row?.id)===44}
  function opportunityLayout(fixture){return isOpportunity(fixture,5)?{badge:'',highlight:true,detail:'🔥 Fırsat Maçı • Doğru sonuç 2 puan • Tam skor 8 puan'}:{badge:'',highlight:false,detail:''}}
  function shouldDecorate(hasHighlight,hasDetail){return !(hasHighlight&&hasDetail)}
  return{isOpportunity,findOpportunityIndex,savedRowOpportunity,opportunityLayout,shouldDecorate};
});

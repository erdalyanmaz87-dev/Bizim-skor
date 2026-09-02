(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{
 root.BizimSkorPredictionOpportunity=api;
 const styleRow=row=>{row.classList.add('prediction-opportunity-match');row.style.background='linear-gradient(180deg,#fff7ed,#ffedd5)';row.style.border='2px solid #fb923c';row.style.borderRadius='12px';row.style.padding='10px 8px';row.style.boxShadow='0 4px 12px rgba(249,115,22,.14)'};
 const addBadge=row=>{if(row.querySelector('.prediction-opportunity-inline'))return;row.insertAdjacentHTML('beforeend',' <span class="prediction-opportunity-inline" style="float:right;margin-left:8px;padding:2px 7px;border-radius:999px;background:#fb923c;color:#fff;font-size:11px;font-weight:900;white-space:nowrap">🔥 X2</span>')};
 const detail=()=>'<div class="prediction-opportunity-detail" style="margin:-2px 0 8px;padding:7px 8px;border-radius:9px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;text-align:center;font-size:12px;font-weight:900">🔥 X2 • Fırsat Maçı • Doğru sonuç 2 puan • Tam skor 8 puan</div>';
 const findRow=(container,index,selector)=>index>=0?[...container.querySelectorAll(selector)][index]:null;
 const apply=()=>{try{if(typeof selectedPredictionWeek==='undefined'||![4,5].includes(+selectedPredictionWeek))return;const index=typeof fixtures!=='undefined'?api.findOpportunityIndex(fixtures,selectedPredictionWeek):-1;if(index<0)return;const fx=document.getElementById('fx'),state=document.getElementById('predictionState');const row=(fx&&findRow(fx,index,'.m'))||(state&&findRow(state,index,'.savedrow'));if(!row)return;if(!row.classList.contains('prediction-opportunity-match'))styleRow(row);addBadge(row);if(!(row.nextElementSibling?.classList.contains('prediction-opportunity-detail')))row.insertAdjacentHTML('afterend',detail())}catch(e){console.warn('prediction opportunity badge',e)}};
 const observer=new MutationObserver(apply);const mount=()=>{const fx=document.getElementById('fx'),state=document.getElementById('predictionState');if(fx)observer.observe(fx,{childList:true,subtree:true});if(state)observer.observe(state,{childList:true,subtree:true});apply()};if(document.readyState==='complete')mount();else window.addEventListener('load',mount);document.addEventListener('change',e=>{if(e.target?.id==='predictionWeekSelect')setTimeout(apply,0)});
 }})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function isOpportunity(f,w){return(+w===4&&+f?.week===4&&+(f?.id??f?.fixture_id)===30)||(+w===5&&+f?.week===5&&+(f?.id??f?.fixture_id)===44)}
 function findOpportunityIndex(fs,w){return(fs||[]).findIndex(f=>isOpportunity(f,w))}
 function savedRowOpportunity(r){return(+r?.week===4&&+(r?.fixture_id??r?.id)===30)||(+r?.week===5&&+(r?.fixture_id??r?.id)===44)}
 function targetContainer(saved){return saved?'predictionState':'fx'}
 function badgeText(f){return isOpportunity(f,f?.week)?'🔥 X2':''}
 function opportunityLayout(f){return isOpportunity(f,f?.week)?{badge:'🔥 X2',highlight:true,detail:'🔥 X2 • Fırsat Maçı • Doğru sonuç 2 puan • Tam skor 8 puan'}:{badge:'',highlight:false,detail:''}}
 function shouldDecorate(h,d){return!(h&&d)}return{isOpportunity,findOpportunityIndex,savedRowOpportunity,targetContainer,badgeText,opportunityLayout,shouldDecorate};});

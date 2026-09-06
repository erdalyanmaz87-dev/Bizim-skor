(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorPredictionWeekCards=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
function buildCards(leagueStatuses,champions){
  const league=(leagueStatuses||[]).slice(0,2).map(x=>({label:`Süper Lig ${x.week}. Hafta`,complete:!!x.complete,deadline:x.deadline||null,theme:'super',target:{type:'league',week:+x.week}}));
  const cl=champions?{label:`Şampiyonlar Ligi ${champions.week}. Hafta`,complete:!!champions.complete,deadline:champions.deadline||null,theme:'champions',target:{type:'champions',week:+champions.week}}:null;
  return[...league,...(cl?[cl]:[])];
}
function championsTabSelector(){return '[data-tab="championsPred"]'}
function selectionValue(card){return card?.target?.type==='league'?String(card.target.week):''}
function canEditBeforeWeekStart(nowMs,firstKickoffMs){return Number(nowMs)<Number(firstKickoffMs)}
function countdownText(deadline,now=Date.now()){
  const remaining=new Date(deadline).getTime()-new Date(now).getTime();
  if(!Number.isFinite(remaining)||remaining<=0)return '🔒 Tahmin süresi doldu';
  const hour=60*60*1000,day=24*hour;
  if(remaining>=day){const days=Math.floor(remaining/day),hours=Math.floor((remaining%day)/hour);return `⏳ Tahmine son ${days} gün${hours?` ${hours} saat`:''}`}
  if(remaining>=hour)return `⏳ Tahmine son ${Math.ceil(remaining/hour)} saat`;
  return `⏳ Tahmine son ${Math.max(1,Math.ceil(remaining/60000))} dakika`;
}
function render(cards,now=Date.now()){
  return `<div class="bs-week-cards">${cards.map((card,i)=>{
    const action=card.complete?'✓ Tahminlerin tamamlandı':'Tahminini yap →';
    const countdown=!card.complete&&card.deadline?`<small class="bs-week-countdown" data-countdown-deadline="${String(card.deadline)}">${countdownText(card.deadline,now)}</small>`:'';
    return `<button type="button" class="bs-week-card theme-${card.theme} ${card.complete?'done':'missing'}" data-bs-card="${i}"><strong>${card.label}</strong><span>${action}</span>${countdown}</button>`;
  }).join('')}</div>`;
}
function updateCountdowns(host,now=Date.now()){host?.querySelectorAll?.('[data-countdown-deadline]').forEach(el=>{el.textContent=countdownText(el.dataset.countdownDeadline,now)})}
function openCard(card){if(!card)return;if(card.target.type==='league'){const select=document.getElementById('predictionWeekSelect');if(select){select.value=selectionValue(card);select.dispatchEvent(new Event('change',{bubbles:true}))}document.querySelector('[data-tab="pred"]')?.click();setTimeout(()=>{const current=document.getElementById('predictionWeekSelect');if(current&&current.value!==selectionValue(card)){current.value=selectionValue(card);current.dispatchEvent(new Event('change',{bubbles:true}))}},120);return}if(typeof root.BizimSkorChampionsUI?.openPrediction==='function')root.BizimSkorChampionsUI.openPrediction();else document.querySelector(championsTabSelector())?.click()}
async function getCards(){const priority=root.BizimSkorHomePriority;if(!priority)return[];let league=[],champions=null;try{if(typeof priority.getStatuses==='function')league=await priority.getStatuses()}catch(_){}try{if(typeof priority.getChampionsStatus==='function')champions=await priority.getChampionsStatus()}catch(_){}return buildCards(league,champions)}
async function refresh(){const pred=document.querySelector('.tabs .tab[data-tab="pred"]');if(!pred)return;let host=document.getElementById('bsPredictionWeekCards');if(!host){host=document.createElement('div');host.id='bsPredictionWeekCards';pred.insertAdjacentElement('afterend',host)}const cards=await getCards();if(!cards.length)return;host.innerHTML=render(cards);host.querySelectorAll('[data-bs-card]').forEach(btn=>btn.addEventListener('click',()=>openCard(cards[+btn.dataset.bsCard])))}
function mount(){if(typeof document==='undefined')return;if(!document.getElementById('bsWeekCardStyles'))document.head.insertAdjacentHTML('beforeend','<style id="bsWeekCardStyles">#bsPredictionWeekCards{width:100%;order:1}.bs-week-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;margin:5px 0 10px}.bs-week-card{min-width:0;min-height:90px;padding:11px 7px;border-radius:14px;text-align:center;box-shadow:0 4px 10px rgba(15,23,42,.12);font-weight:800;cursor:pointer}.bs-week-card strong{display:block;font-size:12px;line-height:1.25}.bs-week-card span{display:block;margin-top:7px;font-size:10px;font-weight:900}.bs-week-card .bs-week-countdown{display:block;margin-top:6px;font-size:9px;line-height:1.25;font-weight:900;color:inherit;opacity:.95}.bs-week-card.theme-super{border:1px solid #15803d;background:linear-gradient(160deg,#166534,#22c55e);color:#fff}.bs-week-card.theme-super.done{background:linear-gradient(160deg,#14532d,#16a34a)}.bs-week-card.theme-champions{border:1px solid #1d4ed8;background:linear-gradient(160deg,#172554,#1d4ed8 62%,#2563eb);color:#fff}@media(max-width:390px){.bs-week-cards{gap:6px}.bs-week-card{padding:9px 4px;min-height:86px}.bs-week-card strong{font-size:11px}.bs-week-card span{font-size:9px}.bs-week-card .bs-week-countdown{font-size:8px}}</style>');refresh();setTimeout(refresh,800);setTimeout(refresh,1900);root.addEventListener?.('focus',refresh);root.addEventListener?.('bizimskor:session-ready',refresh);root.setInterval?.(()=>updateCountdowns(document.getElementById('bsPredictionWeekCards')),60000)}
return Object.freeze({buildCards,championsTabSelector,selectionValue,canEditBeforeWeekStart,countdownText,updateCountdowns,render,openCard,mount,refresh});
});

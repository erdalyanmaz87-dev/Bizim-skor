(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorPredictionWeekCards=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function buildCards(leagueStatuses,champions){
    const league=(leagueStatuses||[]).slice(0,2).map(x=>({label:`Süper Lig ${x.week}. Hafta`,complete:!!x.complete,target:{type:'league',week:+x.week}}));
    const cl=champions?{label:`Şampiyonlar Ligi ${champions.week}. Hafta`,complete:!!champions.complete,target:{type:'champions',week:+champions.week}}:null;
    return [...league,...(cl?[cl]:[])];
  }
  function championsTabSelector(){return '[data-tab="championsPred"]'}
  function canEditBeforeWeekStart(nowMs,firstKickoffMs){return Number(nowMs)<Number(firstKickoffMs)}
  function render(cards){return `<div class="bs-week-cards">${cards.map((card,i)=>`<button type="button" class="bs-week-card ${card.complete?'done':'missing'}" data-bs-card="${i}"><strong>${card.label}</strong><span>${card.complete?'🟢 Tahminlerin tamamlandı':'🔴 Tahminini yap'}</span></button>`).join('')}</div>`}
  function openCard(card){
    if(!card)return;
    if(card.target.type==='league'){
      document.querySelector('[data-tab="pred"]')?.click();
      setTimeout(()=>{const select=document.getElementById('predictionWeekSelect');if(select){select.value=String(card.target.week);select.dispatchEvent(new Event('change',{bubbles:true}))}},50);
      return;
    }
    document.querySelector(championsTabSelector())?.click();
  }
  async function getCards(){
    const priority=root.BizimSkorHomePriority;
    if(!priority)return[];
    let league=[],champions=null;
    try{if(typeof priority.getStatuses==='function')league=await priority.getStatuses()}catch(_){}
    try{if(typeof priority.getChampionsStatus==='function')champions=await priority.getChampionsStatus()}catch(_){}
    return buildCards(league,champions);
  }
  async function refresh(){
    const pred=document.querySelector('.tabs .tab[data-tab="pred"]');if(!pred)return;
    let host=document.getElementById('bsPredictionWeekCards');
    if(!host){host=document.createElement('div');host.id='bsPredictionWeekCards';pred.insertAdjacentElement('afterend',host)}
    const cards=await getCards();if(!cards.length)return;
    host.innerHTML=render(cards);
    host.querySelectorAll('[data-bs-card]').forEach(btn=>btn.addEventListener('click',()=>openCard(cards[+btn.dataset.bsCard])));
  }
  function mount(){
    if(typeof document==='undefined')return;
    if(!document.getElementById('bsWeekCardStyles'))document.head.insertAdjacentHTML('beforeend','<style id="bsWeekCardStyles">#bsPredictionWeekCards{width:100%;order:1}.bs-week-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;width:100%;margin:4px 0 8px}.bs-week-card{min-width:0;padding:10px 6px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;text-align:center;box-shadow:0 2px 7px rgba(15,23,42,.08)}.bs-week-card strong{display:block;font-size:12px;line-height:1.2}.bs-week-card span{display:block;margin-top:5px;font-size:10px;font-weight:800}.bs-week-card.done{border-color:#86efac;background:#f0fdf4}.bs-week-card.missing{border-color:#fca5a5;background:#fff7f7}@media(max-width:390px){.bs-week-card{padding:9px 4px}.bs-week-card strong{font-size:11px}.bs-week-card span{font-size:9px}}</style>');
    refresh();setTimeout(refresh,800);setTimeout(refresh,1900);root.addEventListener?.('focus',refresh);
  }
  return Object.freeze({buildCards,championsTabSelector,canEditBeforeWeekStart,render,openCard,mount,refresh});
});

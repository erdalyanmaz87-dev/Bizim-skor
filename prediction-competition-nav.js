(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorPredictionCompetitionNav=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const COMPETITIONS=[
    ['pred','🇹🇷','Süper Lig'],
    ['championsPred','⭐','Şampiyonlar Ligi'],
    ['nationsPred','🌍','Uluslar Ligi']
  ];
  let observerStarted=false;

  function predictionCompetitionMarkup(active='pred'){
    return `<div id="bsPredictionCompetitionNav" class="bs-prediction-competition-nav" aria-label="Tahmin ligi seçimi">${COMPETITIONS.map(([key,icon,label])=>`<button type="button" data-prediction-competition="${key}"${active===key?' aria-current="page"':''}><span aria-hidden="true">${icon}</span><b>${label}</b></button>`).join('')}</div>`;
  }
  function visibleCompetition(doc){
    for(const [key] of COMPETITIONS){const section=doc?.getElementById?.(key);if(section&&!section.classList.contains('hide'))return key}
    return 'pred';
  }
  function ensureStyles(doc){
    if(!doc||doc.getElementById('bsPredictionCompetitionStyles'))return;
    const style=doc.createElement('style');
    style.id='bsPredictionCompetitionStyles';
    style.textContent='.bs-prediction-competition-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 14px;padding:8px;border:1px solid #dbe4ee;border-radius:16px;background:#fff;box-shadow:0 5px 16px rgba(15,23,42,.06)}.bs-prediction-competition-nav button{display:flex;align-items:center;justify-content:center;gap:6px;min-height:48px;padding:8px 7px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;color:#334155;font:800 12px/1.15 system-ui,-apple-system,sans-serif;text-align:center}.bs-prediction-competition-nav button[aria-current="page"]{border-color:#2563eb;background:#eff6ff;color:#1d4ed8;box-shadow:inset 0 0 0 1px #93c5fd}.bs-prediction-competition-nav button span{font-size:17px}.bs-prediction-competition-nav button b{font-size:12px}html[data-theme="dark"] .bs-prediction-competition-nav{background:#0f172a;border-color:#334155}html[data-theme="dark"] .bs-prediction-competition-nav button{background:#111827;border-color:#475569;color:#e2e8f0}html[data-theme="dark"] .bs-prediction-competition-nav button[aria-current="page"]{background:#172554;border-color:#60a5fa;color:#bfdbfe}@media(max-width:430px){.bs-prediction-competition-nav{gap:5px;padding:6px}.bs-prediction-competition-nav button{min-height:50px;padding:6px 4px;gap:3px;flex-direction:column}.bs-prediction-competition-nav button span{font-size:16px}.bs-prediction-competition-nav button b{font-size:10px}}';
    doc.head?.appendChild(style);
  }
  function bind(nav,doc){
    if(nav.dataset.bound==='1')return;
    nav.dataset.bound='1';
    nav.addEventListener('click',event=>{const button=event.target.closest?.('[data-prediction-competition]');if(button)openCompetition(button.dataset.predictionCompetition,doc)});
  }
  function ensureNav(doc=typeof document!=='undefined'?document:null,requested){
    if(!doc)return false;
    ensureStyles(doc);
    const active=requested||visibleCompetition(doc),target=doc.getElementById(active)||doc.getElementById('pred');
    if(!target)return false;
    let nav=doc.getElementById('bsPredictionCompetitionNav');
    if(!nav){const host=doc.createElement('div');host.innerHTML=predictionCompetitionMarkup(active);nav=host.firstElementChild}
    nav.querySelectorAll('[data-prediction-competition]').forEach(button=>{if(button.dataset.predictionCompetition===active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});
    bind(nav,doc);
    if(nav.parentElement!==target)target.insertAdjacentElement('afterbegin',nav);
    return true;
  }
  function showSuper(doc){
    const tab=doc.querySelector('.tab[data-tab="pred"]');
    if(tab){tab.click();return true}
    doc.querySelectorAll('section').forEach(section=>section.classList.add('hide'));
    doc.getElementById('pred')?.classList.remove('hide');
    return !!doc.getElementById('pred');
  }
  function openCompetition(key,doc=typeof document!=='undefined'?document:null){
    if(!doc)return false;
    let result;
    if(key==='championsPred')result=root?.BizimSkorChampionsUI?.openPrediction?.();
    else if(key==='nationsPred')result=root?.BizimSkorNationsUI?.openPrediction?.();
    else result=showSuper(doc);
    if((key==='championsPred'&&!root?.BizimSkorChampionsUI?.openPrediction)||(key==='nationsPred'&&!root?.BizimSkorNationsUI?.openPrediction)){
      root?.alert?.('Şu anda açık tahmin bulunmuyor.');
      return false;
    }
    Promise.resolve(result).catch(()=>{}).finally(()=>root?.setTimeout?.(()=>ensureNav(doc,key),0));
    ensureNav(doc,key);
    return true;
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc)return false;
    const ready=ensureNav(doc);
    if(!observerStarted&&doc.body&&typeof MutationObserver==='function'){
      observerStarted=true;
      new MutationObserver(()=>ensureNav(doc)).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
    root?.addEventListener?.('bizimskor:nations-prediction-opened',()=>ensureNav(doc,'nationsPred'));
    doc.addEventListener?.('click',event=>{if(event.target.closest?.('[data-simple-nav="pred"]'))root?.setTimeout?.(()=>ensureNav(doc,'pred'),0)});
    return ready;
  }
  return Object.freeze({predictionCompetitionMarkup,visibleCompetition,ensureNav,openCompetition,mount});
});

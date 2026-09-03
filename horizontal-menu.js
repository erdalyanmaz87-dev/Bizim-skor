(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorHorizontalMenu=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const ORDER=['live','sezu','general','resultsWeek','footballCenter','friendLeagues','history','rules','chat'];
  const LABELS={live:'Hafta Sıralaması',sezu:'🏆 Sezu Ödül Sıralaması',general:'Genel Sıralama',resultsWeek:'Fikstür',footballCenter:'⚽ Futbol Merkezi',friendLeagues:'👥 Arkadaş Liglerim',history:'Tahmin Geçmişim',rules:'📜 Kurallar',chat:'💬 Sohbet'};
  function orderMenuTabs(names){const set=new Set(names||[]);return ORDER.filter(name=>set.has(name))}
  function menuLabel(name){return LABELS[name]||name}
  function isPrimaryTab(name){return name==='home'||name==='pred'}
  function ensureStyles(){if(document.getElementById('horizontalMenuStyles'))return;document.head.insertAdjacentHTML('beforeend','<style id="horizontalMenuStyles">.tabs.bs-nav-ready{display:flex;flex-wrap:wrap;gap:8px}.tabs.bs-nav-ready>.tab[data-tab="home"]{order:-3;flex:1 1 100%}.tabs.bs-nav-ready>.prediction-primary-tab{order:-2}.bs-scroll-menu{order:-1;display:flex;gap:9px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;width:100%;padding:3px 14% 8px 1px}.bs-scroll-menu::-webkit-scrollbar{display:none}.bs-scroll-menu>.tab{flex:0 0 132px;min-width:132px;min-height:62px;scroll-snap-align:start;border:1px solid #e2e8f0;box-shadow:0 3px 9px rgba(15,23,42,.08);font-size:12px;line-height:1.25}.bs-scroll-menu>.tab.active{border-color:#1d4ed8}.bs-scroll-menu>.tab[data-tab="chat"]{position:relative}.bs-scroll-menu>.tab[data-tab="chat"].has-unread:after{content:"";position:absolute;right:8px;top:8px;width:9px;height:9px;border-radius:50%;background:#dc2626;box-shadow:0 0 0 2px #fff}@media(max-width:430px){.bs-scroll-menu>.tab{flex-basis:118px;min-width:118px}.bs-scroll-menu{padding-right:18%}}</style>')}
  function mount(){const tabs=document.querySelector('.tabs');if(!tabs||tabs.querySelector('.bs-scroll-menu'))return;ensureStyles();tabs.classList.add('bs-nav-ready');const wrap=document.createElement('div');wrap.className='bs-scroll-menu';const existing=[...tabs.querySelectorAll(':scope > .tab')];const byName=new Map(existing.map(tab=>[tab.dataset.tab,tab]));orderMenuTabs(existing.map(tab=>tab.dataset.tab)).forEach(name=>{const tab=byName.get(name);if(!tab)return;tab.textContent=menuLabel(name);wrap.appendChild(tab)});const pred=byName.get('pred');if(pred)pred.insertAdjacentElement('afterend',wrap);else tabs.appendChild(wrap)}
  return Object.freeze({orderMenuTabs,menuLabel,isPrimaryTab,mount});
});

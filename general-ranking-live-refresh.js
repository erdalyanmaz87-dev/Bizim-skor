(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorGeneralRankingRefresh=api;api.mount()}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function removeLeakedNewlineText(){
    const doc=root.document;
    if(!doc)return false;
    const walker=doc.createTreeWalker(doc.body,root.NodeFilter.SHOW_TEXT);
    const leaked=[];
    while(walker.nextNode()){
      if(walker.currentNode.nodeValue.trim()==='\\n')leaked.push(walker.currentNode);
    }
    leaked.forEach(node=>node.remove());
    return leaked.length>0;
  }

  function loadScript(src){
    if(!root.document)return Promise.resolve(false);
    const existing=root.document.querySelector(`script[data-bizim-skor-src="${src}"]`);
    if(existing)return existing.dataset.loaded==='1'?Promise.resolve(true):new Promise((resolve,reject)=>{
      existing.addEventListener('load',()=>resolve(true),{once:true});
      existing.addEventListener('error',reject,{once:true});
    });
    return new Promise((resolve,reject)=>{
      const script=root.document.createElement('script');
      script.src=src;
      script.defer=true;
      script.dataset.bizimSkorSrc=src;
      script.addEventListener('load',()=>{script.dataset.loaded='1';resolve(true)},{once:true});
      script.addEventListener('error',reject,{once:true});
      root.document.head.appendChild(script);
    });
  }

  function ensureArenaNavigation(){
    const doc=root.document;
    if(!doc)return{};
    const tabs=doc.querySelector('.tabs');
    if(!tabs)return{};

    let arenaTab=tabs.querySelector('.tab[data-tab="arena"]');
    if(!arenaTab){
      arenaTab=doc.createElement('button');
      arenaTab.className='tab arena-tab';
      arenaTab.dataset.tab='arena';
      arenaTab.textContent='🏆 Arena';
      tabs.insertBefore(arenaTab,tabs.firstChild);
    }

    let arenaSection=doc.getElementById('arena');
    if(!arenaSection){
      arenaSection=doc.createElement('section');
      arenaSection.id='arena';
      arenaSection.className='section hide';
      tabs.parentNode.insertBefore(arenaSection,tabs.nextSibling);
    }

    if(!tabs.dataset.arenaBound){
      tabs.dataset.arenaBound='1';
      tabs.addEventListener('click',event=>{
        const tab=event.target.closest('.tab');
        if(!tab)return;
        if(tab.dataset.tab==='arena'){
          doc.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
          doc.querySelectorAll('section[id]').forEach(x=>x.classList.add('hide'));
          arenaTab.classList.add('active');
          arenaSection.classList.remove('hide');
        }else{
          arenaTab.classList.remove('active');
          arenaSection.classList.add('hide');
        }
      });
    }

    return{arenaTab,arenaSection};
  }

  function ensureLeagueMountPoints(){
    const doc=root.document;
    if(!doc)return{};

    const known=doc.getElementById('knownPlayer');
    let summaryHost=doc.getElementById('personalLeagueSummary');
    if(known&&!summaryHost){
      summaryHost=doc.createElement('div');
      summaryHost.id='personalLeagueSummary';
      summaryHost.style.marginTop='10px';
      known.appendChild(summaryHost);
    }

    const{arenaSection}=ensureArenaNavigation();
    let detailHost=doc.getElementById('leagueSystemPanel');
    if(arenaSection&&!detailHost){
      const card=doc.createElement('div');
      card.className='c league-ranking-card';
      card.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px"><div><div class="small">Bizim Skor Ligleri</div><h3 style="margin:2px 0">🏆 Bizim Skor Arena</h3></div><span class="small">4 Süper Lig haftalık dönem</span></div><div id="leagueSystemPanel"><p class="small">Arena bilgileri yükleniyor…</p></div>';
      arenaSection.appendChild(card);
      detailHost=card.querySelector('#leagueSystemPanel');
    }
    return{summaryHost,detailHost};
  }

  async function mountLeagues(){
    if(!root.document||root.__bizimSkorLeagueMounted)return false;
    const token=root.localStorage?.getItem('bizimSkorFriendToken');
    if(!root.sb||!token)return false;
    try{
      ensureArenaNavigation();
      await loadScript('league-system-utils.js');
      await loadScript('league-system-ui.js');
      if(!root.BizimSkorLeagues)return false;

      if(!root.document.getElementById('bizimSkorLeagueStyle')){
        const style=root.document.createElement('style');
        style.id='bizimSkorLeagueStyle';
        style.textContent=root.BizimSkorLeagues.css();
        root.document.head.appendChild(style);
      }

      const{summaryHost,detailHost}=ensureLeagueMountPoints();
      await root.BizimSkorLeagues.mount({sb:root.sb,token,summaryHost,detailHost});

      summaryHost?.addEventListener('click',event=>{
        if(!event.target.closest('[data-league-open]'))return;
        root.document.querySelector('.tab[data-tab="arena"]')?.click();
        setTimeout(()=>detailHost?.scrollIntoView({behavior:'smooth',block:'start'}),80);
      });

      root.__bizimSkorLeagueMounted=true;
      return true;
    }catch(error){
      console.warn('Bizim Skor Arena yüklenemedi',error);
      return false;
    }
  }

  function scheduleLeagueMount(){
    if(root.__bizimSkorLeagueRetryTimer||root.__bizimSkorLeagueMounted)return;
    let attempts=0;
    const attempt=async()=>{
      attempts+=1;
      const mounted=await mountLeagues();
      if(mounted||attempts>=30){
        if(root.__bizimSkorLeagueRetryTimer)root.clearInterval(root.__bizimSkorLeagueRetryTimer);
        root.__bizimSkorLeagueRetryTimer=null;
      }
    };
    setTimeout(attempt,700);
    root.__bizimSkorLeagueRetryTimer=root.setInterval(attempt,2000);
  }

  function mount(){
    if(root.document){
      const ready=()=>{
        removeLeakedNewlineText();
        ensureArenaNavigation();
        scheduleLeagueMount();
      };
      if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',ready,{once:true});
      else ready();
    }
    if(!root.sb||root.__bizimSkorGeneralRankingRefresh)return false;
    root.BizimSkorOpportunityRanking?.mount?.();
    root.__bizimSkorGeneralRankingRefresh=root.sb.channel('general-rank-results-v2')
      .on('postgres_changes',{event:'*',schema:'public',table:'results'},()=>
        root.BizimSkorOpportunityRanking?.refreshAfterResult?.({
          document:root.document,
          loadGeneral:root.loadGeneral
        })
      ).subscribe();
    return true;
  }
  return Object.freeze({mount,removeLeakedNewlineText,mountLeagues,ensureArenaNavigation,ensureLeagueMountPoints,scheduleLeagueMount});
});

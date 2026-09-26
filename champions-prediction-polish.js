(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorChampionsPredictionPolish=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  let observer=null,polishing=false;
  const TIME_RE=/^\s*(\d{1,2}[.:]\d{2})\s*/;
  const LOGO_NAME_ALIASES={
    'slavia prag':'Slavia Praha',
    'leipzig':'RB Leipzig',
    'bayern munih':'Bayern Munchen',
    'stuttgart':'VfB Stuttgart'
  };

  function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
  function teamKey(value){return String(value??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
  function cleanTeamName(value){return String(value??'').replace(TIME_RE,'').trim()}
  function canonicalLogoName(value){const clean=cleanTeamName(value);return LOGO_NAME_ALIASES[teamKey(clean)]||clean}
  function readTeamName(node){
    const branded=node?.querySelector?.('.bs-team-name')?.textContent;
    return cleanTeamName(branded!=null?branded:node?.textContent||'');
  }
  function groupByKickoffTime(items){
    const groups=[];
    for(const item of items||[]){
      const time=String(item?.time||'').trim();
      let group=groups[groups.length-1];
      if(!group||group.time!==time){group={time,items:[]};groups.push(group)}
      group.items.push(item);
    }
    return groups;
  }
  function teamMarkup(name){
    const clean=cleanTeamName(name),lookup=canonicalLogoName(clean),assets=root?.BizimSkorBrandAssets;
    if(!assets)return esc(clean);
    const url=assets.teamLogoUrl?.(lookup),slug=assets.teamSlug?.(lookup);
    if(!url||!slug)return assets.teamMarkup?.(clean)||esc(clean);
    const initials=clean.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
    return `<span class="bs-team-brand" data-team-slug="${esc(slug)}"><img class="bs-team-logo" src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="bs-team-fallback" hidden aria-hidden="true">${esc(initials)}</span><span class="bs-team-name">${esc(clean)}</span></span>`;
  }
  function brandNeedsRepair(renderedName,name,hasLogo,hasKnownLogo){
    const clean=cleanTeamName(name),rendered=cleanTeamName(renderedName);
    return rendered!==clean||(!hasLogo&&hasKnownLogo);
  }
  function ensureTeamBrand(node,name){
    if(!node||!name)return false;
    const brand=node.querySelector?.('.bs-team-brand'),rendered=brand?.querySelector?.('.bs-team-name')?.textContent||'',hasLogo=!!brand?.querySelector?.('.bs-team-logo'),lookup=canonicalLogoName(name),hasKnownLogo=!!root?.BizimSkorBrandAssets?.teamLogoUrl?.(lookup);
    if(brand&&!brandNeedsRepair(rendered,name,hasLogo,hasKnownLogo))return false;
    node.innerHTML=teamMarkup(name);
    if(node.dataset)node.dataset.bsBrandTeam='1';
    return true;
  }
  function ensureStyles(doc){
    if(!doc||doc.getElementById('bsChampionsPredictionPolishStyles'))return;
    const style=doc.createElement('style');style.id='bsChampionsPredictionPolishStyles';
    style.textContent='.champions-time-group{margin:12px 0 7px;padding:7px 11px;border-radius:10px;background:#e0e7ff;color:#3730a3;font:900 13px/1.1 system-ui,-apple-system,sans-serif;letter-spacing:.2px}.champions-match .t{min-width:0;line-height:1.2;overflow-wrap:anywhere}.champions-match .t .bs-team-brand{display:flex;align-items:center;gap:6px;min-width:0}.champions-match .t.home .bs-team-brand{justify-content:flex-end}.champions-match .t .bs-team-logo,.champions-match .t img{width:28px;height:28px;object-fit:contain;flex:0 0 28px}.champions-match .t .bs-team-name{min-width:0}html[data-theme="dark"] .champions-time-group{background:#1e1b4b;color:#c7d2fe}@media(max-width:430px){.champions-time-group{margin-top:10px}.champions-match .t{font-size:12px}.champions-match .t .bs-team-logo,.champions-match .t img{width:25px;height:25px;flex-basis:25px}}';
    doc.head?.appendChild(style);
  }
  function rowTime(row){return String(row?.querySelector?.('.home .small')?.textContent||'').trim()}
  function removeInlineTime(home){
    const time=home?.querySelector?.('.small');if(time)time.remove();
    const br=home?.querySelector?.('br');if(br)br.remove();
  }
  function polishRow(row){
    if(!row||row.dataset?.clPolished==='1')return null;
    const teams=row.querySelectorAll?.('.t')||[];
    const home=row.querySelector?.('.t.home')||teams[0],away=teams[teams.length-1];
    const time=rowTime(row);
    const homeName=readTeamName(home);
    const awayName=readTeamName(away);
    removeInlineTime(home);
    ensureTeamBrand(home,homeName);
    ensureTeamBrand(away,awayName);
    if(row.dataset)row.dataset.clPolished='1';
    return{row,time};
  }
  function decorateRobot(){root?.setTimeout?.(()=>root?.BizimSkorRobotUI?.decorate?.(),0)}
  function polish(doc=typeof document!=='undefined'?document:null){
    if(!doc||polishing)return false;
    const box=doc.getElementById?.('championsFixtures');if(!box)return false;
    const pending=[...box.querySelectorAll?.('.champions-match')||[]].filter(row=>row.dataset?.clPolished!=='1');
    if(!pending.length)return false;
    polishing=true;
    try{
      ensureStyles(doc);
      box.querySelectorAll?.('.champions-time-group').forEach?.(node=>node.remove());
      let lastTime=null;
      for(const row of [...box.children]){
        if(row.classList?.contains?.('champions-day')){lastTime=null;continue}
        if(!row.classList?.contains?.('champions-match'))continue;
        const info=polishRow(row);const time=info?.time||row.dataset?.kickoffTime||'';
        if(row.dataset)row.dataset.kickoffTime=time;
        if(time&&time!==lastTime){
          const heading=doc.createElement('div');heading.className='champions-time-group';heading.textContent=time;
          row.insertAdjacentElement('beforebegin',heading);lastTime=time;
        }
      }
      decorateRobot();return true;
    }finally{polishing=false}
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc)return false;ensureStyles(doc);
    const run=()=>root?.setTimeout?.(()=>polish(doc),0);
    if(!observer&&typeof MutationObserver==='function'){
      observer=new MutationObserver(run);const box=doc.getElementById?.('championsFixtures')||doc.body;
      if(box)observer.observe(box,{childList:true,subtree:true});
    }
    root?.addEventListener?.('bizimskor:champions-prediction-opened',run);
    doc.addEventListener?.('click',event=>{if(event.target?.closest?.('[data-prediction-competition="championsPred"]'))root?.setTimeout?.(run,250)});
    run();return true;
  }
  return Object.freeze({cleanTeamName,canonicalLogoName,readTeamName,brandNeedsRepair,groupByKickoffTime,polish,mount});
});

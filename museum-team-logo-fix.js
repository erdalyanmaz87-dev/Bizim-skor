(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorMuseumTeamLogoFix=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const norm=v=>String(v??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c');
  const rankingSelectors=[
    '#weeklyRankingBoard table tr td:nth-child(2)',
    '#sezuBoard table tr td:nth-child(2)',
    '#generalBoard table tr td:nth-child(2)',
    '#friendLeagueRanking table tr td:nth-child(2)',
    '#championsRankingBoard table tr td:nth-child(2)',
    '#championsWeeklyRankingBoard table tr td:nth-child(2)',
    '.league-player',
    '[data-player-name]',
    '.bs-museum-head h2'
  ];
  let contextPromise=null,teamMap=null,timer=null,lastToken='';

  function cleanName(el){
    const named=el?.matches?.('[data-player-name]')?el:el?.querySelector?.('[data-player-name]');
    if(named?.dataset?.playerName)return String(named.dataset.playerName).trim();
    return String(el?.textContent||'')
      .replace(/^🏛️\s*/,'')
      .replace(/^Sen\s*•\s*/i,'')
      .trim();
  }

  function targetFor(el){return el?.matches?.('[data-player-name]')?el:(el?.querySelector?.('[data-player-name]')||el)}

  async function loadContext(){
    const token=root.localStorage?.getItem('bizimSkorFriendToken')||'';
    if(!token||!root.sb)return null;
    if(token!==lastToken){lastToken=token;contextPromise=null;teamMap=null}
    if(teamMap)return teamMap;
    if(contextPromise)return contextPromise;
    contextPromise=root.sb.rpc('get_supported_team_context',{p_token:token}).then(q=>{
      if(q.error)throw q.error;
      const rows=q.data?.players||[];
      teamMap=new Map(rows.filter(x=>x?.name&&x?.supported_team).map(x=>[norm(x.name),String(x.supported_team)]));
      return teamMap;
    }).catch(error=>{contextPromise=null;throw error});
    return contextPromise;
  }

  function prependLogo(el,code){
    const target=targetFor(el);
    if(!target||target.querySelector?.('.bs-supported-team-logo'))return false;
    const markup=root.BizimSkorSupportedTeam?.playerLogoMarkup?.(code);
    if(!markup)return false;
    target.insertAdjacentHTML('afterbegin',markup);
    const img=target.querySelector('.bs-supported-team-logo');
    if(img)img.style.marginRight='6px';
    return true;
  }

  function decorateWithMap(doc,map){
    if(!doc||!map)return 0;
    let count=0;
    rankingSelectors.forEach(selector=>doc.querySelectorAll(selector).forEach(el=>{
      const name=cleanName(el),code=map.get(norm(name));
      if(code&&prependLogo(el,code))count++;
    }));
    return count;
  }

  async function refresh(doc=typeof document!=='undefined'?document:null){
    if(!doc)return 0;
    const map=await loadContext();
    return decorateWithMap(doc,map);
  }

  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.documentElement?.dataset?.museumTeamLogoFix==='2')return false;
    if(doc.documentElement)doc.documentElement.dataset.museumTeamLogoFix='2';
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>refresh(doc).catch(e=>console.warn('supported team logos',e)),60)};
    new MutationObserver(schedule).observe(doc.body,{childList:true,subtree:true});
    root.addEventListener?.('bizimskor:session-ready',()=>{contextPromise=null;teamMap=null;lastToken='';schedule()});
    root.addEventListener?.('focus',schedule);
    schedule();
    return true;
  }

  return Object.freeze({rankingSelectors,cleanName,decorateWithMap,refresh,mount});
});

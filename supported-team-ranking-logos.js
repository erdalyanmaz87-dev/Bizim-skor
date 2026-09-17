(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorSupportedTeamRankingLogos=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const SELECTORS=[
    '#weeklyRankingBoard table tr td:nth-child(2)',
    '#liveBoard table tr td:nth-child(2)',
    '#live table tr td:nth-child(2)',
    '#sezuBoard table tr td:nth-child(2)',
    '#sezu table tr td:nth-child(2)',
    '#generalBoard table tr td:nth-child(2)',
    '#general table tr td:nth-child(2)',
    '#friendLeagueRanking table tr td:nth-child(2)',
    '#friendLeagues table tr td:nth-child(2)',
    '#championsRankingBoard table tr td:nth-child(2)',
    '#championsWeeklyRankingBoard table tr td:nth-child(2)',
    '.league-player',
    '.bs-museum-head h2'
  ];
  const norm=v=>String(v??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c');
  let map=null,pending=null,lastToken='',timer=null;

  function cleanName(el){
    return String(el?.textContent||'')
      .replace(/^\s*🏛️\s*/,'')
      .replace(/^\s*Sen\s*•\s*/i,'')
      .trim();
  }
  async function teamMap(){
    const token=root.localStorage?.getItem('bizimSkorFriendToken')||'';
    if(!token||!root.sb?.rpc)return null;
    if(token!==lastToken){lastToken=token;map=null;pending=null}
    if(map)return map;
    if(pending)return pending;
    pending=root.sb.rpc('get_supported_team_context',{p_token:token}).then(res=>{
      if(res.error)throw res.error;
      map=new Map((res.data?.players||[]).filter(x=>x?.name&&x?.supported_team).map(x=>[norm(x.name),String(x.supported_team)]));
      return map;
    }).catch(error=>{pending=null;throw error});
    return pending;
  }
  function decorate(doc,teams){
    if(!doc||!teams)return 0;
    let added=0;
    SELECTORS.forEach(selector=>doc.querySelectorAll(selector).forEach(el=>{
      if(el.querySelector?.('.bs-supported-team-logo'))return;
      const code=teams.get(norm(cleanName(el)));
      if(!code)return;
      const markup=root.BizimSkorSupportedTeam?.playerLogoMarkup?.(code);
      if(!markup)return;
      el.insertAdjacentHTML('afterbegin',markup);
      const img=el.querySelector('.bs-supported-team-logo');
      if(img){img.style.marginRight='6px';img.style.verticalAlign='middle'}
      added++;
    }));
    return added;
  }
  async function refresh(doc=typeof document!=='undefined'?document:null){
    if(!doc)return 0;
    return decorate(doc,await teamMap());
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.documentElement?.dataset?.supportedTeamRankingLogos==='1')return false;
    doc.documentElement.dataset.supportedTeamRankingLogos='1';
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>refresh(doc).catch(e=>console.warn('supported team ranking logos',e)),120)};
    schedule();
    new MutationObserver(schedule).observe(doc.body,{childList:true,subtree:true});
    root.addEventListener?.('focus',schedule);
    root.addEventListener?.('bizimskor:session-ready',()=>{map=null;pending=null;lastToken='';schedule()});
    return true;
  }
  return Object.freeze({SELECTORS,cleanName,decorate,refresh,mount});
});

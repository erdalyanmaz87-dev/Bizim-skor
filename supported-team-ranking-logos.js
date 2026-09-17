(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorSupportedTeamRankingLogos=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const norm=v=>String(v??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/\s+/g,' ');
  let map=null,pending=null,lastToken='',timer=null;

  function cleanName(value){
    return String(value?.textContent??value??'')
      .replace(/^\s*🏛️\s*/,'')
      .replace(/^\s*Sen\s*•\s*/i,'')
      .replace(/\s*•\s*Sen\s*$/i,'')
      .trim();
  }
  function tablePlayerCells(doc){
    const cells=[];
    doc.querySelectorAll('table').forEach(table=>{
      const headers=[...table.querySelectorAll('tr:first-child th')];
      const playerIndex=headers.findIndex(th=>{
        const label=norm(th.textContent);
        return label==='oyuncu'||label==='katilimci';
      });
      if(playerIndex<0)return;
      table.querySelectorAll('tr').forEach((row,index)=>{
        if(index===0)return;
        const cell=row.children?.[playerIndex];
        if(cell)cells.push(cell);
      });
    });
    return cells;
  }
  function playerNameTargets(doc){
    const found=new Set();
    doc.querySelectorAll('[data-player-name],.league-player,.bs-museum-head h2').forEach(el=>found.add(el));
    tablePlayerCells(doc).forEach(cell=>{
      const marked=cell.querySelector?.('[data-player-name]');
      found.add(marked||cell);
    });
    return [...found];
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
      pending=null;
      return map;
    }).catch(error=>{pending=null;throw error});
    return pending;
  }
  function decorateOne(el,teams){
    if(!el||el.querySelector?.(':scope > .bs-supported-team-logo'))return false;
    const explicit=el.dataset?.playerName||el.closest?.('[data-player-name]')?.dataset?.playerName||'';
    const name=cleanName(explicit||el);
    const code=teams.get(norm(name));
    if(!code)return false;
    const markup=root.BizimSkorSupportedTeam?.playerLogoMarkup?.(code);
    if(!markup)return false;
    el.insertAdjacentHTML('afterbegin',markup);
    const img=el.querySelector(':scope > .bs-supported-team-logo');
    if(img){img.style.marginRight='6px';img.style.verticalAlign='middle'}
    if(!el.dataset.playerName)el.dataset.playerName=name;
    return true;
  }
  function decorate(doc,teams){
    if(!doc||!teams)return 0;
    let added=0;
    playerNameTargets(doc).forEach(el=>{if(decorateOne(el,teams))added++});
    return added;
  }
  async function refresh(doc=typeof document!=='undefined'?document:null){
    if(!doc)return 0;
    return decorate(doc,await teamMap());
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.documentElement?.dataset?.supportedTeamRankingLogos==='1')return false;
    doc.documentElement.dataset.supportedTeamRankingLogos='1';
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>refresh(doc).catch(e=>console.warn('supported team ranking logos',e)),80)};
    schedule();
    new MutationObserver(schedule).observe(doc.body,{childList:true,subtree:true});
    root.addEventListener?.('focus',schedule);
    root.addEventListener?.('bizimskor:session-ready',()=>{map=null;pending=null;lastToken='';schedule()});
    return true;
  }
  return Object.freeze({cleanName,tablePlayerCells,playerNameTargets,decorateOne,decorate,refresh,mount});
});

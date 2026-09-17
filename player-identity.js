(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorPlayerIdentity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const norm=v=>String(v??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/\s+/g,' ');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const LOGO_CLASS='bs-supported-team-logo';
  let teamMap=new Map(),loading=null,lastToken='';
  function ensureStyle(doc=typeof document!=='undefined'?document:null){if(!doc||doc.getElementById('bsPlayerIdentityStyles'))return;const style=doc.createElement('style');style.id='bsPlayerIdentityStyles';style.textContent='.bs-player-label{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}.bs-player-label .bs-supported-team-logo{width:22px;height:22px;object-fit:contain;display:inline-block;flex:0 0 auto;margin:0}.bs-player-label-name{display:inline-block}';doc.head.appendChild(style)}
  function setRows(rows=[]){teamMap=new Map(rows.filter(x=>x?.name&&x?.supported_team).map(x=>[norm(x.name),String(x.supported_team)]));return teamMap}
  async function loadContext(force=false){
    const token=root.localStorage?.getItem('bizimSkorFriendToken')||'';
    if(!token||!root.sb?.rpc)return teamMap;
    if(token!==lastToken){lastToken=token;teamMap=new Map();loading=null}
    if(teamMap.size&&!force)return teamMap;
    if(loading&&!force)return loading;
    loading=root.sb.rpc('get_supported_team_context',{p_token:token}).then(res=>{loading=null;if(res.error)throw res.error;setRows(res.data?.players||[]);return teamMap}).catch(err=>{loading=null;throw err});
    return loading;
  }
  function teamCode(name){return teamMap.get(norm(name))||''}
  function playerLabel(name,options={}){
    ensureStyle();
    const clean=String(name??'').trim(),code=teamCode(clean),suffix=options.suffix?String(options.suffix):'';
    const logo=code&&root.BizimSkorSupportedTeam?.playerLogoMarkup?root.BizimSkorSupportedTeam.playerLogoMarkup(code,''):'';
    return `<span class="bs-player-label" data-player-name="${esc(clean)}">${logo}<span class="bs-player-label-name">${esc(clean)}${suffix}</span></span>`;
  }
  function markup(name,options={}){return playerLabel(name,options)}
  function nameOnly(name){return playerLabel(name)}
  function invalidate(){teamMap=new Map();loading=null;return loadContext(true)}
  function mount(){
    ensureStyle();
    loadContext().catch(e=>console.warn('player identity',e));
    root.addEventListener?.('bizimskor:session-ready',()=>loadContext(true).catch(e=>console.warn('player identity',e)));
    root.addEventListener?.('supported-team:saved',()=>invalidate().catch(e=>console.warn('player identity',e)));
  }
  mount();
  return Object.freeze({LOGO_CLASS,norm,setRows,loadContext,teamCode,playerLabel,markup,nameOnly,invalidate});
});

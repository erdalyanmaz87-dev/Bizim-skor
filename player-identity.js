(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorPlayerIdentity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const norm=v=>String(v??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/\s+/g,' ');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let teamMap=new Map(),loading=null,lastToken='';
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
  function markup(name,options={}){
    const clean=String(name??'').trim(),code=teamCode(clean),plain=esc(clean),suffix=options.suffix?String(options.suffix):'';
    const logo=code&&root.BizimSkorSupportedTeam?.playerLogoMarkup?root.BizimSkorSupportedTeam.playerLogoMarkup(code,''):'';
    return `<span class="bs-player-identity" data-player-name="${esc(clean)}">${logo}${plain}${suffix}</span>`;
  }
  function nameOnly(name){return markup(name)}
  function invalidate(){teamMap=new Map();loading=null;return loadContext(true)}
  function mount(){
    loadContext().catch(e=>console.warn('player identity',e));
    root.addEventListener?.('bizimskor:session-ready',()=>loadContext(true).catch(e=>console.warn('player identity',e)));
    root.addEventListener?.('supported-team:saved',()=>invalidate().catch(e=>console.warn('player identity',e)));
  }
  mount();
  return Object.freeze({norm,setRows,loadContext,teamCode,markup,nameOnly,invalidate});
});

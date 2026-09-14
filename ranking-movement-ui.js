(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorRankingMovementUI=api;api.mount()}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const tracked=new WeakSet();

  function text(node){return String(node?.textContent||'').trim()}
  function number(value){const m=String(value??'').match(/-?\d+(?:[.,]\d+)?/);return m?Number(m[0].replace(',','.')):0}
  function contextKey(host,kind){
    if(kind==='general')return'general';
    if(kind==='weekly'){
      const title=text(root.document?.getElementById('weeklyRankingTitle'))||'weekly';
      const board=String(host?.id||'weekly');
      return`weekly:${board}:${title.toLocaleLowerCase('tr-TR')}`;
    }
    if(kind==='arena'){
      const heading=text(host.closest?.('.league-shell')?.querySelector('h2'))||'arena';
      return'arena:'+heading.toLocaleLowerCase('tr-TR');
    }
    return kind;
  }

  function tableRows(host){
    return [...(host?.querySelectorAll?.('table tr')||[])].slice(1).map((tr,index)=>{
      const cells=tr.querySelectorAll('td');
      if(cells.length<2)return null;
      const name=text(cells[1].querySelector?.('.bs-player-profile-link'))||text(cells[1]);
      const rank=number(cells[0]);
      const metric=[...cells].slice(2).map(cell=>text(cell)).join('|');
      return{name,rank:rank||index+1,metric,rankNode:cells[0]};
    }).filter(Boolean);
  }

  function arenaRows(host){
    return [...(host?.querySelectorAll?.('.league-row')||[])].map((row,index)=>({
      name:text(row.querySelector('.league-player')).replace(/^Sen\s*•\s*/i,''),
      rank:number(row.querySelector('.league-rank'))||index+1,
      metric:[text(row.querySelector('.league-performance')),text(row.querySelector('.league-rounds'))].join('|'),
      rankNode:row.querySelector('.league-rank')
    })).filter(row=>row.name&&row.rankNode);
  }

  function apply(host,kind){
    const movement=root.BizimSkorRankingMovement;
    if(!movement||!host)return false;
    movement.ensureStyles?.();
    const rows=kind==='arena'?arenaRows(host):tableRows(host);
    if(!rows.length)return false;
    const state=movement.track(contextKey(host,kind),rows);
    rows.forEach(row=>{
      const current=movement.movementFor(state,row.name);
      row.rankNode.querySelectorAll?.('.bs-rank-move').forEach(node=>node.remove());
      if(current)row.rankNode.insertAdjacentHTML('beforeend',movement.badge(current));
    });
    return true;
  }

  function scan(doc=root.document){
    if(!doc)return false;
    let changed=false;
    const known=[
      ['generalBoard','general'],
      ['weeklyRankingBoard','weekly'],
      ['championsWeeklyRankingBoard','weekly'],
      ['nationsWeeklyRankingBoard','weekly']
    ];
    known.forEach(([id,kind])=>{const host=doc.getElementById(id);if(host)changed=apply(host,kind)||changed});
    doc.querySelectorAll?.('#leagueSystemPanel .league-table-wrap').forEach(host=>{changed=apply(host,'arena')||changed});
    return changed;
  }

  function mount(){
    const doc=root.document,Observer=root.MutationObserver;
    if(!doc||!Observer||root.__bizimSkorRankingMovementObserver)return false;
    let timer=null;
    const schedule=()=>{root.clearTimeout?.(timer);timer=root.setTimeout?.(()=>scan(doc),40)};
    const start=()=>{
      scan(doc);
      const observer=new Observer(schedule);
      observer.observe(doc.body,{childList:true,subtree:true,characterData:true});
      root.__bizimSkorRankingMovementObserver=observer;
    };
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
    return true;
  }

  return Object.freeze({number,tableRows,arenaRows,contextKey,apply,scan,mount});
});

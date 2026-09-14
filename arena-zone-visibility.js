(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorArenaZoneVisibility=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function parseTargets(text=''){
    const value=String(text||''),promotion=value.match(/İlk\s+(\d+)\s+yükselir/i),relegation=value.match(/Son\s+(\d+)\s+düşer/i);
    return{promotion:promotion?Number(promotion[1]):0,relegation:relegation?Number(relegation[1]):0};
  }
  function zoneForRank(rank,size,targets={}){
    const r=Number(rank)||0,n=Number(size)||0,p=Number(targets.promotion)||0,d=Number(targets.relegation)||0;
    if(p>0&&r>0&&r<=p)return'promotion';
    if(d>0&&r>n-d)return'relegation';
    return'none';
  }
  function zoneLabel(zone){return zone==='promotion'?'↑ Yükselir':zone==='relegation'?'↓ Düşer':'';}
  function rankOf(row,index){const value=Number(String(row?.querySelector?.('.league-rank')?.textContent||'').replace(/[^0-9]/g,''));return value||index+1;}
  function ensureStyles(doc){
    if(!doc?.head||doc.getElementById('arenaZoneVisibilityStyles'))return;
    const style=doc.createElement('style');style.id='arenaZoneVisibilityStyles';style.textContent='.league-player{min-width:0}.league-zone-badge{display:block;width:max-content;max-width:100%;margin-top:3px;padding:2px 6px;border-radius:999px;font-size:9px;line-height:1.35;font-weight:900;letter-spacing:.01em}.league-zone-badge.promotion{background:#dcfce7;color:#166534;border:1px solid #86efac}.league-zone-badge.relegation{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5}html[data-theme="dark"] .league-promotion-zone{background:#052e16!important;color:#dcfce7!important}html[data-theme="dark"] .league-relegation-zone{background:#450a0a!important;color:#fee2e2!important}html[data-theme="dark"] .league-row:not(.league-promotion-zone):not(.league-relegation-zone){background:#111827!important;color:#e5e7eb!important}html[data-theme="dark"] .league-zone-badge.promotion{background:#14532d;color:#dcfce7;border-color:#22c55e}html[data-theme="dark"] .league-zone-badge.relegation{background:#7f1d1d;color:#fee2e2;border-color:#ef4444}';doc.head.appendChild(style);
  }
  function decorateTable(table){
    if(!table?.querySelectorAll)return false;
    const targets=parseTargets(table.querySelector('.league-movement-info')?.textContent||''),rows=[...table.querySelectorAll('.league-row')],size=rows.length;
    if(!size||(!targets.promotion&&!targets.relegation))return false;
    rows.forEach((row,index)=>{
      const rank=rankOf(row,index),zone=zoneForRank(rank,size,targets),promotion=zone==='promotion',relegation=zone==='relegation';
      row.classList.toggle('league-promotion-zone',promotion);
      row.classList.toggle('league-relegation-zone',relegation);
      if(promotion||relegation)row.classList.remove('league-championship-zone');
      row.classList.toggle('league-promotion-boundary',promotion&&rank===targets.promotion);
      row.classList.toggle('league-relegation-boundary',relegation&&rank===size-targets.relegation+1);
      const player=row.querySelector('.league-player');if(!player)return;
      let badge=player.querySelector('.league-zone-badge');const label=zoneLabel(zone);
      if(!label){badge?.remove();return}
      if(!badge){badge=player.ownerDocument.createElement('small');badge.className='league-zone-badge';player.appendChild(badge)}
      badge.classList.toggle('promotion',promotion);badge.classList.toggle('relegation',relegation);if(badge.textContent!==label)badge.textContent=label;
    });
    return true;
  }
  function decorate(doc=typeof document!=='undefined'?document:null){if(!doc)return false;ensureStyles(doc);let changed=false;doc.querySelectorAll('.league-table-wrap').forEach(table=>{changed=decorateTable(table)||changed});return changed;}
  function mount(doc=typeof document!=='undefined'?document:null){if(!doc||doc.__bsArenaZoneVisibility)return false;doc.__bsArenaZoneVisibility=true;const run=()=>decorate(doc);run();if(typeof MutationObserver==='function')new MutationObserver(()=>run()).observe(doc.body,{childList:true,subtree:true});return true;}
  return Object.freeze({parseTargets,zoneForRank,zoneLabel,rankOf,decorateTable,decorate,mount});
});

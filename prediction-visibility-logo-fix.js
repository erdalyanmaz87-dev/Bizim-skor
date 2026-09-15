(function(root){
  if(typeof document==='undefined')return;
  const STYLE_ID='bsPredictionVisibilityLogoFix';
  function ensureStyles(doc=document){
    if(doc.getElementById(STYLE_ID))return false;
    const s=doc.createElement('style');s.id=STYLE_ID;s.textContent=`
/* Keep premium layout, only repair unreadable light panels and prediction team visibility */
.saved,.savedrow,.saved *,.savedrow *{color:#0f172a!important;opacity:1!important}
.saved .small,.savedrow .small{color:#475569!important}
.saved{background:#ecfdf5!important;border-color:#86efac!important}
.bs-screen-content #pred .m.opportunity-match,.bs-screen-content #pred .m[data-opportunity]{color:#0f172a!important}
.bs-screen-content #pred .m.opportunity-match .t,.bs-screen-content #pred .m.opportunity-match .bs-team-name,.bs-screen-content #pred .m[data-opportunity] .t,.bs-screen-content #pred .m[data-opportunity] .bs-team-name{color:#0f172a!important;text-shadow:none!important}
.bs-screen-content #pred .m.opportunity-match .bs-team-fallback,.bs-screen-content #pred .m[data-opportunity] .bs-team-fallback{color:#fff!important}
.bs-screen-content #pred .m:not(.opportunity-match):not([data-opportunity]) .t,.bs-screen-content #pred .m:not(.opportunity-match):not([data-opportunity]) .bs-team-name{color:#fff!important}
.bs-screen-content #pred .m .bs-team-logo{display:block!important;visibility:visible!important;opacity:1!important}
.bs-screen-content #pred .m .bs-team-brand{visibility:visible!important;opacity:1!important}
html:not([data-theme="dark"]) .saved,html:not([data-theme="dark"]) .savedrow,html:not([data-theme="dark"]) .saved *,html:not([data-theme="dark"]) .savedrow *{color:#0f172a!important}
html[data-theme="dark"] .saved,html[data-theme="dark"] .savedrow,html[data-theme="dark"] .saved *,html[data-theme="dark"] .savedrow *{color:#0f172a!important}
`;
    doc.head.appendChild(s);return true;
  }
  function rawTeamName(node){
    if(!node)return'';
    const named=node.querySelector?.('.bs-team-name');
    return String(named?.textContent||node.textContent||'').trim();
  }
  function resetTeamNode(node){
    if(!node)return;
    const name=rawTeamName(node);
    if(!name)return;
    node.textContent=name;
    node.removeAttribute('data-bs-brand-team');
  }
  function repairPredictionLogos(doc=document){
    const rows=doc.querySelectorAll?.('#pred .m,.champions-match,.fixture-nations .m')||[];
    rows.forEach(row=>{
      const teams=row.querySelectorAll?.('.t')||[];
      if(teams.length<2)return;
      resetTeamNode(teams[0]);
      resetTeamNode(teams[teams.length-1]);
    });
    root.BizimSkorBrandVisualUI?.decoratePredictionTeams?.(doc);
    root.BizimSkorBrandVisualUI?.decorate?.(doc);
  }
  function scheduleRepair(doc=document){
    [0,80,250,650].forEach(ms=>root.setTimeout?.(()=>repairPredictionLogos(doc),ms));
  }
  function bindWeekChanges(doc=document){
    doc.querySelectorAll?.('select').forEach(sel=>{
      const text=`${sel.id||''} ${sel.name||''} ${sel.getAttribute('aria-label')||''} ${sel.closest('label')?.textContent||''}`.toLocaleLowerCase('tr-TR');
      if(!/(week|hafta|prediction)/.test(text)||sel.dataset.bsLogoRepairBound==='1')return;
      sel.dataset.bsLogoRepairBound='1';
      sel.addEventListener('change',()=>scheduleRepair(doc));
    });
  }
  function mount(doc=document){
    ensureStyles(doc);bindWeekChanges(doc);scheduleRepair(doc);
    if(root.MutationObserver){
      const obs=new root.MutationObserver(()=>{bindWeekChanges(doc);scheduleRepair(doc)});
      obs.observe(doc.body,{childList:true,subtree:true});
      doc.__bsPredictionVisibilityObserver=obs;
    }
    doc.addEventListener('click',()=>root.setTimeout?.(()=>{bindWeekChanges(doc);repairPredictionLogos(doc)},0),true);
    root.addEventListener?.('focus',()=>scheduleRepair(doc));
    return true;
  }
  root.BizimSkorPredictionVisibilityLogoFix=Object.freeze({ensureStyles,repairPredictionLogos,scheduleRepair,bindWeekChanges,mount});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount(document),{once:true});else mount(document);
})(typeof globalThis!=='undefined'?globalThis:this);

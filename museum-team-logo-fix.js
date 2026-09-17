(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorMuseumTeamLogoFix=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  let timer=null;
  function refresh(doc){
    const museum=doc?.getElementById?.('bsPlayerMuseumModal');
    if(!museum||museum.classList.contains('hide')||!museum.querySelector('.bs-museum-head h2'))return false;
    const run=root.BizimSkorSupportedTeam?.refresh;
    if(typeof run!=='function')return false;
    Promise.resolve(run(doc)).catch(e=>console.warn('museum team logo refresh',e));
    return true;
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.documentElement?.dataset?.museumTeamLogoFix==='1')return false;
    if(doc.documentElement)doc.documentElement.dataset.museumTeamLogoFix='1';
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>refresh(doc),40)};
    new MutationObserver(schedule).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    doc.addEventListener('click',e=>{if(e.target.closest?.('[data-player-museum-open],#bsHeaderMuseumAction'))setTimeout(schedule,0)},true);
    schedule();
    return true;
  }
  return Object.freeze({refresh,mount});
});

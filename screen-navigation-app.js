(function(root,factory){
  const api=factory(root?.BizimSkorScreenNavigation,root?.BizimSkorScreenNavigationUI);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorScreenNavigationApp=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(nav,ui){
  const PRIMARY_IDS=new Set(['pred','arena','championsRanking','nationsRanking','general','weeklyRankings','resultsWeek','footballCenter','friendLeagues','history','rules','chat','championsPred','nationsPred']);
  function normalizeTargetId(id){return nav?.canonicalScreenId?.(id)||String(id||'')}
  function shouldNavigateTab(id){const key=normalizeTargetId(id);return key!=='home'&&PRIMARY_IDS.has(key)}
  function resolveSectionId(id){const key=normalizeTargetId(id);return key==='weeklyRankings'?'weeklyRankings':key}
  function titleFor(id){return nav?.screenDefinition?.(id)?.title||ui?.screenTitle?.({id})||String(id||'')}
  function createPlaceholder(doc,section){const marker=doc.createComment?.(`screen:${section.id}`);section.parentNode?.insertBefore?.(marker,section);return marker}
  function ensureLayer(doc){
    let layer=doc.getElementById?.('bsScreenLayer');
    if(layer)return layer;
    layer=doc.createElement('div');layer.id='bsScreenLayer';layer.className='bs-screen-layer hide';doc.body.appendChild(layer);return layer;
  }
  function createNavigationApp({doc,win,navigation=nav,view=ui}={}){
    if(!doc||!navigation||!view)throw new Error('screen navigation dependencies required');
    const runtimeWin=win||globalThis;let state=navigation.createNavigationState(),active=null;
    function rememberCurrentScroll(){if(!active)return;state=navigation.rememberScroll(state,active.content?.scrollTop||0)}
    function restoreMoved(){
      if(!active)return;
      const {section,marker}=active;
      marker?.parentNode?.insertBefore?.(section,marker);
      marker?.remove?.();
      active=null;
    }
    function renderScreen(screen){
      const section=doc.getElementById?.(resolveSectionId(screen.id));if(!section)return false;
      restoreMoved();
      const layer=ensureLayer(doc),marker=createPlaceholder(doc,section);layer.innerHTML=view.screenShellMarkup(screen);const content=layer.querySelector?.('[data-screen-content]');if(!content)return false;
      section.classList?.remove?.('hide');content.appendChild(section);layer.classList.remove('hide');active={section,marker,content,layer};
      content.scrollTop=Number(screen.scrollY)||0;
      layer.querySelector?.('[data-screen-back]')?.addEventListener?.('click',()=>back());
      return true;
    }
    function open(id,context=null){
      const screenId=normalizeTargetId(id);if(!shouldNavigateTab(screenId))return false;
      if(navigation.currentScreen(state).id===screenId&&active)return true;
      rememberCurrentScroll();restoreMoved();state=navigation.pushScreen(state,{id:screenId,title:titleFor(screenId),context});
      return renderScreen(navigation.currentScreen(state));
    }
    function back(){
      rememberCurrentScroll();restoreMoved();state=navigation.popScreen(state);const target=navigation.currentScreen(state);
      if(target.id==='home'){
        const layer=ensureLayer(doc);layer.classList.add('hide');layer.innerHTML='';
        runtimeWin?.scrollTo?.({top:Number(target.scrollY)||0,behavior:'auto'});return true;
      }
      return renderScreen(target);
    }
    function onDocumentClick(event){
      const tab=event.target?.closest?.('.tab[data-tab]');if(!tab)return;
      const id=tab.dataset?.tab;if(!shouldNavigateTab(id))return;
      runtimeWin?.setTimeout?.(()=>open(id),0);
    }
    function mount(){doc.addEventListener?.('click',onDocumentClick);return true}
    function snapshot(){return{state,activeId:active?.section?.id||null}}
    return Object.freeze({open,back,mount,snapshot,onDocumentClick,restoreMoved});
  }
  return Object.freeze({PRIMARY_IDS,normalizeTargetId,shouldNavigateTab,resolveSectionId,titleFor,createNavigationApp});
});

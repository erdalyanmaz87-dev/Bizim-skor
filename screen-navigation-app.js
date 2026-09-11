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
  function makeHistoryState(screen,depth,base={}){return{...(base||{}),bizimSkorScreen:true,screenId:String(screen?.id||'home'),screenDepth:Math.max(1,Number(depth)||1)}}
  function isNavigationHistoryState(value){return value?.bizimSkorScreen===true&&Number(value?.screenDepth)>=1}
  function createPlaceholder(doc,section){const marker=doc.createComment?.(`screen:${section.id}`);section.parentNode?.insertBefore?.(marker,section);return marker}
  function ensureLayer(doc){let layer=doc.getElementById?.('bsScreenLayer');if(layer)return layer;layer=doc.createElement('div');layer.id='bsScreenLayer';layer.className='bs-screen-layer hide';doc.body.appendChild(layer);return layer}
  function createNavigationApp({doc,win,navigation=nav,view=ui}={}){
    if(!doc||!navigation||!view)throw new Error('screen navigation dependencies required');
    const runtimeWin=win||globalThis;let state=navigation.createNavigationState(),active=null,mounted=false;
    const historyApi=runtimeWin?.history;
    function depth(){return state?.stack?.length||1}
    function rememberCurrentScroll(){
      const current=navigation.currentScreen(state);
      const scroll=active?(active.content?.scrollTop||0):(current.id==='home'?(runtimeWin?.scrollY||runtimeWin?.pageYOffset||0):0);
      state=navigation.rememberScroll(state,scroll);
    }
    function restoreMoved(){if(!active)return;const{section,marker}=active;marker?.parentNode?.insertBefore?.(section,marker);marker?.remove?.();active=null}
    function renderScreen(screen){
      const section=doc.getElementById?.(resolveSectionId(screen.id));if(!section)return false;
      restoreMoved();const layer=ensureLayer(doc),marker=createPlaceholder(doc,section);layer.innerHTML=view.screenShellMarkup(screen);const content=layer.querySelector?.('[data-screen-content]');if(!content)return false;
      section.classList?.remove?.('hide');content.appendChild(section);layer.classList.remove('hide');active={section,marker,content,layer};content.scrollTop=Number(screen.scrollY)||0;
      layer.querySelector?.('[data-screen-back]')?.addEventListener?.('click',()=>back());return true;
    }
    function hideLayerForHome(){restoreMoved();const layer=ensureLayer(doc);layer.classList.add('hide');layer.innerHTML='';runtimeWin?.scrollTo?.({top:Number(navigation.currentScreen(state).scrollY)||0,behavior:'auto'});return true}
    function open(id,context=null,{historyMode='push'}={}){
      const screenId=normalizeTargetId(id);if(!shouldNavigateTab(screenId))return false;if(navigation.currentScreen(state).id===screenId&&active)return true;
      rememberCurrentScroll();restoreMoved();state=navigation.pushScreen(state,{id:screenId,title:titleFor(screenId),context});const screen=navigation.currentScreen(state);const rendered=renderScreen(screen);
      if(rendered&&historyMode==='push'&&historyApi?.pushState)historyApi.pushState(makeHistoryState(screen,depth()),'');return rendered;
    }
    function popInternal(){rememberCurrentScroll();restoreMoved();state=navigation.popScreen(state);const target=navigation.currentScreen(state);return target.id==='home'?hideLayerForHome():renderScreen(target)}
    function back(){if(depth()<=1)return hideLayerForHome();if(historyApi?.back&&isNavigationHistoryState(historyApi.state)){historyApi.back();return true}return popInternal()}
    function onPopState(event){if(depth()<=1)return hideLayerForHome();popInternal();return isNavigationHistoryState(event?.state)||navigation.currentScreen(state).id==='home'}
    function onDocumentClick(event){const tab=event.target?.closest?.('.tab[data-tab]');if(!tab)return;const id=tab.dataset?.tab;if(!shouldNavigateTab(id))return;runtimeWin?.setTimeout?.(()=>open(id),0)}
    function mount(){if(mounted)return true;mounted=true;doc.addEventListener?.('click',onDocumentClick);runtimeWin?.addEventListener?.('popstate',onPopState);if(historyApi?.replaceState){const rootScreen=navigation.currentScreen(state);historyApi.replaceState(makeHistoryState(rootScreen,1,historyApi.state),'')}return true}
    function snapshot(){return{state,activeId:active?.section?.id||null}}
    return Object.freeze({open,back,popInternal,mount,snapshot,onDocumentClick,onPopState,restoreMoved});
  }
  return Object.freeze({PRIMARY_IDS,normalizeTargetId,shouldNavigateTab,resolveSectionId,titleFor,makeHistoryState,isNavigationHistoryState,createNavigationApp});
});

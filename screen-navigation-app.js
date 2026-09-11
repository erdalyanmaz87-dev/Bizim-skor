(function(root,factory){
  const api=factory(root?.BizimSkorScreenNavigation,root?.BizimSkorScreenNavigationUI,root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorScreenNavigationApp=api;api.autoMount?.()}
})(typeof globalThis!=='undefined'?globalThis:this,function(nav,ui,root){
  const PRIMARY_IDS=new Set(['pred','arena','championsRanking','nationsRanking','general','weeklyRankings','resultsWeek','footballCenter','friendLeagues','history','rules','chat','championsPred','nationsPred']);
  const GUARDED_IDS=new Set(['pred','championsPred','nationsPred']);
  function normalizeTargetId(id){return nav?.canonicalScreenId?.(id)||String(id||'')}
  function shouldNavigateTab(id){const key=normalizeTargetId(id);return key!=='home'&&PRIMARY_IDS.has(key)}
  function resolveSectionId(id){const key=normalizeTargetId(id);return key==='weeklyRankings'?'weeklyRankings':key}
  function titleFor(id){return nav?.screenDefinition?.(id)?.title||ui?.screenTitle?.({id})||String(id||'')}
  function makeHistoryState(screen,depth,base={}){return{...(base||{}),bizimSkorScreen:true,screenId:String(screen?.id||'home'),screenDepth:Math.max(1,Number(depth)||1)}}
  function isNavigationHistoryState(value){return value?.bizimSkorScreen===true&&Number(value?.screenDepth)>=1}
  function createPlaceholder(doc,section){const marker=doc.createComment?.(`screen:${section.id}`);section.parentNode?.insertBefore?.(marker,section);return marker}
  function ensureLayer(doc){let layer=doc.getElementById?.('bsScreenLayer');if(layer)return layer;layer=doc.createElement('div');layer.id='bsScreenLayer';layer.className='bs-screen-layer hide';doc.body.appendChild(layer);return layer}
  function ensureStyle(doc){if(!doc||doc.querySelector?.('link[data-bs-screen-nav]'))return;const link=doc.createElement('link');link.rel='stylesheet';link.href='screen-navigation.css';link.dataset.bsScreenNav='1';doc.head.appendChild(link)}
  function createNavigationApp({doc,win,navigation=nav,view=ui}={}){
    if(!doc||!navigation||!view)throw new Error('screen navigation dependencies required');
    const runtimeWin=win||globalThis;let state=navigation.createNavigationState(),active=null,detail=null,mounted=false;
    const historyApi=runtimeWin?.history;
    function depth(){return state?.stack?.length||1}
    function rememberCurrentScroll(){const current=navigation.currentScreen(state),scroll=active?(active.content?.scrollTop||0):(current.id==='home'?(runtimeWin?.scrollY||runtimeWin?.pageYOffset||0):0);state=navigation.rememberScroll(state,scroll)}
    function canLeaveCurrent(){const current=navigation.currentScreen(state);if(!GUARDED_IDS.has(current.id))return true;const dirty=root?.BizimSkorHeaderUI?.hasUnsavedPredictionChanges?.(doc)===true;if(!dirty)return true;const ask=runtimeWin?.confirm?.bind(runtimeWin);return ask?ask('Kaydedilmemiş tahmin değişikliklerin var. Bu ekrandan çıkarsan değişiklikler kaybolacak. Devam etmek istiyor musun?'):false}
    function restoreMoved(){if(!active)return;const{section,marker}=active;marker?.parentNode?.insertBefore?.(section,marker);marker?.remove?.();active=null}
    function renderScreen(screen){const section=doc.getElementById?.(resolveSectionId(screen.id));if(!section)return false;restoreMoved();const layer=ensureLayer(doc),marker=createPlaceholder(doc,section);layer.innerHTML=view.screenShellMarkup(screen);const content=layer.querySelector?.('[data-screen-content]');if(!content)return false;section.classList?.remove?.('hide');content.appendChild(section);layer.classList.remove('hide');active={section,marker,content,layer};content.scrollTop=Number(screen.scrollY)||0;layer.querySelector?.('[data-screen-back]')?.addEventListener?.('click',()=>back());return true}
    function hideLayerForHome(){restoreMoved();const layer=ensureLayer(doc);layer.classList.add('hide');layer.innerHTML='';runtimeWin?.scrollTo?.({top:Number(navigation.currentScreen(state).scrollY)||0,behavior:'auto'});return true}
    function open(id,context=null,{historyMode='push'}={}){const screenId=normalizeTargetId(id);if(!shouldNavigateTab(screenId))return false;if(navigation.currentScreen(state).id===screenId&&active)return true;if(!canLeaveCurrent())return false;rememberCurrentScroll();restoreMoved();state=navigation.pushScreen(state,{id:screenId,title:titleFor(screenId),context});const screen=navigation.currentScreen(state),rendered=renderScreen(screen);if(rendered&&historyMode==='push'&&historyApi?.pushState)historyApi.pushState(makeHistoryState(screen,depth()),'');return rendered}
    function openDetail(id,{title,context=null,onClose}={}){const screenId=normalizeTargetId(id),def=navigation.screenDefinition?.(screenId);if(!def?.detail&&screenId!=='supportPlayer'&&screenId!=='supportAdmin')return false;rememberCurrentScroll();state=navigation.pushScreen(state,{id:screenId,title:title||titleFor(screenId),context});detail={id:screenId,onClose:typeof onClose==='function'?onClose:null};const screen=navigation.currentScreen(state);if(historyApi?.pushState)historyApi.pushState(makeHistoryState(screen,depth()),'');return true}
    function closeDetailOnly(){const closing=detail;detail=null;try{closing?.onClose?.()}catch(error){console.warn('screen detail close',error)}return true}
    function popInternal(){const current=navigation.currentScreen(state);if(detail&&current.id===detail.id){closeDetailOnly();state=navigation.popScreen(state);const target=navigation.currentScreen(state);if(active){active.content.scrollTop=Number(target.scrollY)||0;return true}return target.id==='home'?hideLayerForHome():renderScreen(target)}rememberCurrentScroll();restoreMoved();state=navigation.popScreen(state);const target=navigation.currentScreen(state);return target.id==='home'?hideLayerForHome():renderScreen(target)}
    function back(){if(depth()<=1)return hideLayerForHome();if(!canLeaveCurrent())return false;if(historyApi?.back&&isNavigationHistoryState(historyApi.state)){historyApi.back();return true}return popInternal()}
    function onPopState(event){if(depth()<=1)return hideLayerForHome();if(!canLeaveCurrent()){historyApi?.go?.(1);return false}popInternal();return isNavigationHistoryState(event?.state)||navigation.currentScreen(state).id==='home'}
    function onDocumentClick(event){const tab=event.target?.closest?.('.tab[data-tab]');if(!tab)return;const id=tab.dataset?.tab;if(!shouldNavigateTab(id))return;runtimeWin?.setTimeout?.(()=>open(id),0)}
    function mount(){if(mounted)return true;mounted=true;ensureStyle(doc);doc.addEventListener?.('click',onDocumentClick);runtimeWin?.addEventListener?.('popstate',onPopState);if(historyApi?.replaceState){const rootScreen=navigation.currentScreen(state);historyApi.replaceState(makeHistoryState(rootScreen,1,historyApi.state),'')}return true}
    function snapshot(){return{state,activeId:active?.section?.id||null,detailId:detail?.id||null}}
    return Object.freeze({open,openDetail,back,popInternal,mount,snapshot,onDocumentClick,onPopState,restoreMoved,canLeaveCurrent});
  }
  function autoMount(){if(typeof document==='undefined'||root?.BizimSkorScreenNavigationRuntime)return root?.BizimSkorScreenNavigationRuntime||null;const run=()=>{if(root.BizimSkorScreenNavigationRuntime)return root.BizimSkorScreenNavigationRuntime;const app=createNavigationApp({doc:document,win:root,navigation:nav,view:ui});app.mount();root.BizimSkorScreenNavigationRuntime=app;return app};if(document.readyState==='complete')root.setTimeout?.(run,80);else root.addEventListener?.('load',()=>root.setTimeout?.(run,80),{once:true});return null}
  return Object.freeze({PRIMARY_IDS,GUARDED_IDS,normalizeTargetId,shouldNavigateTab,resolveSectionId,titleFor,makeHistoryState,isNavigationHistoryState,ensureStyle,createNavigationApp,autoMount});
});

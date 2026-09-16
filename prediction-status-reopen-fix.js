(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorPredictionStatusReopenFix=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function panelVisualState(open){
    return open
      ?{transform:'translate(-50%, 0)',opacity:'1',visibility:'visible'}
      :{transform:'translate(-50%, calc(100% + 100px))',opacity:'0',visibility:'hidden'};
  }
  function shouldResyncForClick(simpleNav,simpleAccount){
    return simpleNav==='predictionStatus'||simpleAccount==='inviteChampion';
  }
  function applyState(doc,open){
    const layer=doc?.getElementById?.('bsSimpleFeatureLayer');
    const panel=layer?.querySelector?.('.bs-simple-feature-panel');
    if(!layer||!panel)return false;
    const state=panelVisualState(open);
    panel.style.transform=state.transform;
    panel.style.opacity=state.opacity;
    panel.style.visibility=state.visibility;
    panel.style.pointerEvents=open?'auto':'none';
    panel.style.willChange=open?'transform,opacity':'';
    if(open){
      layer.style.visibility='visible';
      layer.style.pointerEvents='auto';
    }else if(!layer.classList.contains('is-open')){
      layer.style.visibility='hidden';
      layer.style.pointerEvents='none';
    }
    return true;
  }
  function sync(doc){
    const layer=doc?.getElementById?.('bsSimpleFeatureLayer');
    if(!layer)return false;
    return applyState(doc,layer.classList.contains('is-open'));
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.__bsPredictionStatusReopenFix)return false;
    doc.__bsPredictionStatusReopenFix=true;
    const resync=()=>{
      root.requestAnimationFrame?.(()=>sync(doc));
      root.setTimeout?.(()=>sync(doc),40);
      root.setTimeout?.(()=>sync(doc),240);
    };
    doc.addEventListener('click',event=>{
      const nav=event.target?.closest?.('[data-simple-nav]');
      const account=event.target?.closest?.('[data-simple-account]');
      if(shouldResyncForClick(nav?.dataset?.simpleNav,account?.dataset?.simpleAccount))resync();
      if(nav?.dataset.simpleNav==='home'||nav?.dataset.simpleNav==='pred')root.setTimeout?.(()=>sync(doc),0);
      if(event.target?.closest?.('[data-simple-feature-close]'))root.setTimeout?.(()=>sync(doc),0);
    },true);
    if(root.MutationObserver){
      const observer=new root.MutationObserver(mutations=>{
        if(mutations.some(m=>m.type==='attributes'&&m.attributeName==='class'&&m.target?.id==='bsSimpleFeatureLayer'))resync();
      });
      observer.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['class']});
      doc.__bsPredictionStatusReopenObserver=observer;
    }
    root.setTimeout?.(()=>sync(doc),0);
    return true;
  }
  return Object.freeze({panelVisualState,shouldResyncForClick,applyState,sync,mount});
});

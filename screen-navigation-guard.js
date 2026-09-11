(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorScreenNavigationGuard=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
const PREDICTION_IDS=['pred','championsPred','nationsPred'];
function currentPredictionScreen(doc){for(const id of PREDICTION_IDS){const el=doc?.getElementById?.(id);if(el?.classList?.contains?.('bs-screen-active')&&!el.classList.contains('hide'))return id}return null}
function shouldAllowLeave({current,target,dirty,confirmFn}){if(!current||current===target||!dirty)return true;return typeof confirmFn==='function'?!!confirmFn():false}
function hasDirtyPredictions(doc){return root.BizimSkorHeaderUI?.hasUnsavedPredictionChanges?.(doc)===true}
function ask(){return root.confirm?.('Kaydedilmemiş tahmin değişikliklerin var. Bu ekrandan çıkarsan değişiklikler kaybolacak. Devam etmek istiyor musun?')===true}
function guardEvent(event,doc){const current=currentPredictionScreen(doc);if(!current)return true;const targetEl=event.target?.closest?.('.tab[data-tab],#bsHeaderHomeAction,.bs-screen-back');if(!targetEl)return true;const target=targetEl.dataset?.tab||'home';const allowed=shouldAllowLeave({current,target,dirty:hasDirtyPredictions(doc),confirmFn:ask});if(allowed)return true;event.preventDefault?.();event.stopImmediatePropagation?.();return false}
function mount(doc=typeof document!=='undefined'?document:null){if(!doc)return;doc.addEventListener('click',event=>guardEvent(event,doc),true)}
return Object.freeze({PREDICTION_IDS,currentPredictionScreen,shouldAllowLeave,hasDirtyPredictions,guardEvent,mount});
});

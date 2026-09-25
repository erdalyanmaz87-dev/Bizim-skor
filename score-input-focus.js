(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorScoreInputFocus=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
const INPUT_SELECTOR='#fx input.s:not(:disabled),#championsFixtures input:not(:disabled),#nationsFixtures input.s:not(:disabled)';
const timers=new WeakMap();
function validScore(value){const text=String(value??'').trim();return /^\d{1,2}$/.test(text)&&+text>=0&&+text<=20}
function inputList(input,doc){const container=input?.closest?.('#fx,#championsFixtures,#nationsFixtures');return [...(container||doc)?.querySelectorAll?.(INPUT_SELECTOR)||[]].filter(node=>!node.disabled)}
function advance(input,doc=typeof document!=='undefined'?document:null){if(!input||!doc||!validScore(input.value))return null;const inputs=inputList(input,doc),index=inputs.indexOf(input),next=index>=0?inputs[index+1]:null;if(!next)return null;next.focus?.();next.select?.();return next}
function schedule(input,doc,delay=220){const old=timers.get(input);if(old)root.clearTimeout?.(old);const timer=root.setTimeout?.(()=>{timers.delete(input);advance(input,doc)},delay);if(timer)timers.set(input,timer);return timer}
function mount(doc=typeof document!=='undefined'?document:null){if(!doc||doc.documentElement?.dataset?.scoreInputFocusMounted)return false;if(doc.documentElement?.dataset)doc.documentElement.dataset.scoreInputFocusMounted='1';doc.addEventListener('input',event=>{const input=event.target;if(!input?.matches?.(INPUT_SELECTOR))return;schedule(input,doc)});return true}
return Object.freeze({INPUT_SELECTOR,validScore,inputList,advance,schedule,mount});
});

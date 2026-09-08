(function(root){
function byId(id){return document.getElementById(id)}
function hide(id){byId(id)?.classList.add('hide')}
function visible(id){const el=byId(id);return !!el&&!el.classList.contains('hide')}
function activeTab(){return document.querySelector('.tab.active')?.dataset?.tab||''}
function guard(){
  const tab=activeTab();
  if(tab!=='nationsRanking')hide('nationsRanking');
  if(tab!=='championsRanking')hide('championsRanking');
  if(visible('pred')){
    hide('nationsRanking');
    hide('nationsPred');
    hide('championsRanking');
    hide('championsPred');
  }
}
function mount(){
  if(typeof document==='undefined')return;
  document.addEventListener('click',event=>{
    const tab=event.target?.closest?.('.tab')?.dataset?.tab;
    if(!tab)return;
    if(tab!=='nationsRanking')hide('nationsRanking');
    if(tab!=='championsRanking')hide('championsRanking');
    setTimeout(guard,80);
    setTimeout(guard,350);
  });
  new MutationObserver(()=>{if(visible('pred'))guard()}).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
  setInterval(()=>{if(visible('pred'))guard()},1200);
}
root.BizimSkorSectionVisibilityGuard=Object.freeze({guard,mount});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);

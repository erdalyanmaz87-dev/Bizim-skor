(function(root){
function byId(id){return document.getElementById(id)}
function hide(id){byId(id)?.classList.add('hide')}
function show(id){byId(id)?.classList.remove('hide')}
function visible(id){const el=byId(id);return !!el&&!el.classList.contains('hide')}
function activeTab(){return document.querySelector('.tab.active')?.dataset?.tab||''}
function hideRankingsExcept(tab){
  if(tab!=='nationsRanking')hide('nationsRanking');
  if(tab!=='championsRanking')hide('championsRanking');
}
function guard(){
  const tab=activeTab();
  hideRankingsExcept(tab);
  if(visible('nationsPred')){
    hide('pred');
    hide('championsPred');
    hide('nationsRanking');
    hide('championsRanking');
    return;
  }
  if(visible('championsPred')){
    hide('pred');
    hide('nationsPred');
    hide('nationsRanking');
    hide('championsRanking');
    return;
  }
  if(visible('pred')){
    hide('nationsRanking');
    hide('championsRanking');
    hide('nationsPred');
    hide('championsPred');
  }
}
function openSuperPrediction(){
  hide('nationsRanking');hide('championsRanking');hide('nationsPred');hide('championsPred');show('pred');
}
function mount(){
  if(typeof document==='undefined')return;
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('[data-bs-card]'))return;
    const tab=event.target?.closest?.('.tab')?.dataset?.tab;
    if(!tab)return;
    if(tab==='pred')openSuperPrediction();
    else hideRankingsExcept(tab);
    setTimeout(guard,80);
    setTimeout(guard,350);
  });
  new MutationObserver(()=>guard()).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
}
root.BizimSkorSectionVisibilityGuard=Object.freeze({guard,mount,openSuperPrediction});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);

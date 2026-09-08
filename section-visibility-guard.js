(function(root){
function byId(id){return document.getElementById(id)}
function hide(id){byId(id)?.classList.add('hide')}
function show(id){byId(id)?.classList.remove('hide')}
function visible(id){const el=byId(id);return !!el&&!el.classList.contains('hide')}
function hideRankings(){hide('nationsRanking');hide('championsRanking')}
function openSuperPrediction(){hideRankings();hide('nationsPred');hide('championsPred');show('pred')}
function openNationsPrediction(){hideRankings();hide('pred');hide('championsPred');show('nationsPred')}
function openChampionsPrediction(){hideRankings();hide('pred');hide('nationsPred');show('championsPred')}
function guard(){
  if(visible('nationsPred')){hide('pred');hide('championsPred');hideRankings();return}
  if(visible('championsPred')){hide('pred');hide('nationsPred');hideRankings();return}
  if(visible('pred')){hide('nationsPred');hide('championsPred');hideRankings()}
}
function mount(){
  if(typeof document==='undefined')return;
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('[data-bs-card]'))return;
    const tab=event.target?.closest?.('.tab')?.dataset?.tab;
    if(tab==='pred')openSuperPrediction();
    if(tab==='nationsRanking')hide('championsRanking');
    if(tab==='championsRanking')hide('nationsRanking');
    setTimeout(guard,220);
  });
  root.addEventListener?.('bizimskor:nations-prediction-opened',()=>setTimeout(openNationsPrediction,0));
  root.addEventListener?.('bizimskor:champions-prediction-opened',()=>setTimeout(openChampionsPrediction,0));
}
root.BizimSkorSectionVisibilityGuard=Object.freeze({guard,mount,openSuperPrediction,openNationsPrediction,openChampionsPrediction});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
function byId(id){return document.getElementById(id)}
function hide(id){byId(id)?.classList.add('hide')}
function show(id){byId(id)?.classList.remove('hide')}
function hideAllPredictionScreens(){hide('pred');hide('nationsPred');hide('championsPred')}
function hideRankings(){hide('nationsRanking');hide('championsRanking')}
function openSuperPrediction(){hideRankings();hide('nationsPred');hide('championsPred');show('pred')}
function openNationsPrediction(){hideRankings();hide('pred');hide('championsPred');show('nationsPred')}
function openChampionsPrediction(){hideRankings();hide('pred');hide('nationsPred');show('championsPred')}
function openRanking(tab){
  hideAllPredictionScreens();
  if(tab==='nationsRanking'){hide('championsRanking');hide('general');show('nationsRanking');setTimeout(()=>root.BizimSkorNationsUI?.loadRanking?.(),0);return}
  if(tab==='championsRanking'){hide('nationsRanking');hide('general');show('championsRanking');return}
  if(tab==='general'){hideRankings();show('general');setTimeout(()=>root.loadGeneral?.(),0);return}
}
function mount(){
  if(typeof document==='undefined')return;
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('[data-bs-card]'))return;
    const tab=event.target?.closest?.('.tab')?.dataset?.tab;
    if(tab==='pred'){openSuperPrediction();return}
    if(tab==='general'||tab==='nationsRanking'||tab==='championsRanking'){openRanking(tab);return}
  },true);
  root.addEventListener?.('bizimskor:nations-prediction-opened',()=>setTimeout(openNationsPrediction,0));
  root.addEventListener?.('bizimskor:champions-prediction-opened',()=>setTimeout(openChampionsPrediction,0));
}
root.BizimSkorSectionVisibilityGuard=Object.freeze({mount,openSuperPrediction,openNationsPrediction,openChampionsPrediction,openRanking});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);

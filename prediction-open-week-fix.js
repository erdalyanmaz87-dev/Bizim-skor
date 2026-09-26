(function(root){
  function numericWeek(value,fallback){const n=Number(value);return Number.isInteger(n)&&n>0?n:fallback}
  function selectedValue(id,fallback){return numericWeek(root.document?.getElementById?.(id)?.value,fallback)}

  function wrapNations(){
    const original=root.BizimSkorNationsUI;
    if(!original||original.__selectedWeekOpenFix)return false;
    const wrapped={...original,openPrediction(week){
      const fallback=original.currentWeek?.()||1;
      const requested=numericWeek(week,selectedValue('nationsPredictionWeekSelect',fallback));
      return original.openPrediction(requested);
    },__selectedWeekOpenFix:true};
    root.BizimSkorNationsUI=Object.freeze(wrapped);
    return true;
  }

  function wrapChampions(){
    const original=root.BizimSkorChampionsUI;
    if(!original||original.__selectedWeekOpenFix)return false;
    const wrapped={...original,openPrediction(){
      const requested=selectedValue('championsPredictionWeekSelect',original.currentWeek?.()||2);
      const opened=original.openPrediction();
      const loader=root.BizimSkorActivePredictionWeekSelector?.loadChampionWeek;
      return typeof loader==='function'?loader(requested):opened;
    },__selectedWeekOpenFix:true};
    root.BizimSkorChampionsUI=Object.freeze(wrapped);
    return true;
  }

  function apply(){return wrapNations()||wrapChampions()}
  function mount(){apply();root.setTimeout?.(apply,400);root.setTimeout?.(apply,1200);root.addEventListener?.('bizimskor:nations-ready',apply)}
  root.BizimSkorPredictionOpenWeekFix=Object.freeze({numericWeek,selectedValue,wrapNations,wrapChampions,apply,mount});
  mount();
})(typeof globalThis!=='undefined'?globalThis:this);

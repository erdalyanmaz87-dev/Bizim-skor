const assert=require('assert');
const nav=require('./prediction-competition-nav.js');

const superMarkup=nav.predictionCompetitionMarkup('pred');
assert.match(superMarkup,/data-prediction-competition="pred"[^>]*aria-current="page"/);
assert.match(superMarkup,/>🇹🇷<\/span><b>Süper Lig<\/b>/);
assert.match(superMarkup,/data-prediction-competition="championsPred"/);
assert.match(superMarkup,/>⭐<\/span><b>Şampiyonlar Ligi<\/b>/);
assert.match(superMarkup,/data-prediction-competition="nationsPred"/);
assert.match(superMarkup,/>🌍<\/span><b>Uluslar Ligi<\/b>/);

const championsMarkup=nav.predictionCompetitionMarkup('championsPred');
assert.match(championsMarkup,/data-prediction-competition="championsPred"[^>]*aria-current="page"/);

function fakeDoc(){
  const sections={pred:{id:'pred'},championsPred:{id:'championsPred'},nationsPred:{id:'nationsPred'}};
  const selector={dataset:{bound:'1'},parentElement:sections.pred,querySelectorAll:()=>[],addEventListener:()=>{}};
  return {
    getElementById:id=>id==='bsPredictionCompetitionNav'?selector:(id==='bsPredictionCompetitionStyles'?{}:sections[id]||null),
    querySelector:()=>null,
    querySelectorAll:()=>[],
    head:{appendChild:()=>{}},
    createElement:()=>({}),
    addEventListener:()=>{}
  };
}

const runtimeCalls=[],loads=[],legacy=[];
global.BizimSkorScreenNavigationRuntime={open:(id,context)=>{runtimeCalls.push([id,context]);return true}};
global.BizimSkorChampionsUI={loadPrediction:()=>{loads.push('champions')},openPrediction:()=>{legacy.push('champions')}};
global.BizimSkorNationsUI={loadPrediction:()=>{loads.push('nations')},openPrediction:()=>{legacy.push('nations')}};

nav.openCompetition('championsPred',fakeDoc());
nav.openCompetition('nationsPred',fakeDoc());
assert.deepStrictEqual(runtimeCalls.map(x=>x[0]),['championsPred','nationsPred']);
assert.deepStrictEqual(loads,['champions','nations']);
assert.deepStrictEqual(legacy,[]);

delete global.BizimSkorScreenNavigationRuntime;
delete global.BizimSkorChampionsUI;
delete global.BizimSkorNationsUI;

console.log('prediction-competition-nav ok');

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

function fakeSimpleNavigationDoc(){
  const hidden={contains:name=>name==='hide'};
  const pred={id:'pred',classList:hidden,insertAdjacentElement:()=>{throw new Error('legacy league nav must not be inserted in simplified navigation')}};
  const selector={removeCalled:false,remove(){this.removeCalled=true},dataset:{bound:'1'},querySelectorAll:()=>[],addEventListener:()=>{}};
  return {
    selector,
    body:{classList:{contains:name=>name==='bs-simple-nav-ready'}},
    getElementById:id=>id==='home'?{id:'home',classList:hidden}:id==='pred'?pred:id==='championsPred'||id==='nationsPred'?{id,classList:hidden}:id==='bsPredictionCompetitionNav'?selector:(id==='bsPredictionCompetitionStyles'?{}:null),
    querySelector:()=>null,
    querySelectorAll:()=>[],
    head:{appendChild:()=>{}},
    createElement:()=>({}),
    addEventListener:()=>{}
  };
}

const simpleDoc=fakeSimpleNavigationDoc();
assert.strictEqual(nav.ensureNav(simpleDoc),false,'sade menü açıkken eski lig seçici render edilmemeli');
assert.strictEqual(simpleDoc.selector.removeCalled,true,'önceden kalmış eski lig seçici temizlenmeli');

delete global.BizimSkorScreenNavigationRuntime;
delete global.BizimSkorChampionsUI;
delete global.BizimSkorNationsUI;

console.log('prediction-competition-nav ok');

const test=require('node:test');
const assert=require('node:assert/strict');
const nav=require('../simple-navigation.js');
const reopen=require('../prediction-status-reopen-fix.js');
test('closing prediction status clears inline visibility even without a mounted observer',()=>{
 const classes=new Set(['is-open']);
 const panel={style:{}};
 const layer={style:{},dataset:{opener:'predictionStatus'},classList:{contains:c=>classes.has(c),remove:c=>classes.delete(c)},setAttribute(k,v){this[k]=v},querySelector:()=>panel};
 const doc={getElementById:id=>id==='bsSimpleFeatureLayer'?layer:null,querySelector:()=>null,querySelectorAll:()=>[],body:{style:{},classList:{remove(){}}}};
 const previous=global.BizimSkorPredictionStatusReopenFix;
 global.BizimSkorPredictionStatusReopenFix=reopen;
 try{
  reopen.applyState(doc,true);
  nav.closeTransientLayers(doc);
  assert.equal(layer.classList.contains('is-open'),false);
  assert.equal(layer['aria-hidden'],'true');
  assert.equal(panel.style.visibility,'hidden');
  assert.equal(panel.style.pointerEvents,'none');
  assert.equal(layer.style.pointerEvents,'none');
  classes.add('is-open');reopen.sync(doc);
  assert.equal(panel.style.visibility,'visible');
  assert.equal(panel.style.pointerEvents,'auto');
 }finally{global.BizimSkorPredictionStatusReopenFix=previous}
});

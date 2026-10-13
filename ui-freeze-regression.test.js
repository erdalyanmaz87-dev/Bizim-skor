const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('unchanged prediction label does not create another DOM mutation',()=>{
 const context={document:{readyState:'loading',addEventListener(){}},setTimeout(){}};
 vm.runInNewContext(fs.readFileSync('prediction-bottom-sheet.js','utf8'),context);
 let writes=0,value='2 - 1';const action={get textContent(){return value},set textContent(v){writes++;value=v},classList:{toggle(){}}};
 const row={querySelector(s){return s==='[data-bs-prediction-open]'?action:null},querySelectorAll(){return [{value:'2'},{value:'1'}]}};
 context.BizimSkorPredictionBottomSheet.syncRowLabel(row);
 context.BizimSkorPredictionBottomSheet.syncRowLabel(row);
 assert.equal(writes,0);
});
test('visibility repair does not mutate an already visible panel',()=>{
 let removes=0;const panel={classList:{contains(){return false},remove(){removes++}}};
 const doc={getElementById(){return {}},querySelector(){return panel},addEventListener(){}};
 const context={document:doc};vm.runInNewContext(fs.readFileSync('prediction-bottom-sheet-visibility-fix.js','utf8'),context);
 context.BizimSkorPredictionBottomSheetVisibilityFix.repair(doc);
 assert.equal(removes,0);
});
test('prediction status dialog is independent of application section hiding',()=>{
 const api=require('./simple-navigation');assert(!api.featureMarkup().includes('<section'));assert(api.featureMarkup().includes('role="dialog"'));
});
test('SkorBot observes prediction hosts and coalesces repeated decoration requests',()=>{
 const hosts=Object.fromEntries(['fx','predictionState','championsFixtures','championsState','nationsFixtures','nationsState'].map(id=>[id,{id}]));
 let callback;const observed=[],timers=[];
 const doc={readyState:'complete',body:{id:'body'},getElementById:id=>hosts[id],addEventListener(){}};
 const ctx={document:doc,MutationObserver:class{constructor(fn){callback=fn}observe(el){observed.push(el.id)}},setTimeout(fn){timers.push(fn)},setInterval(){},clearInterval(){}};
 vm.runInNewContext(fs.readFileSync('robot-prediction-ui.js','utf8'),ctx);
 assert(!observed.includes('body'));assert.equal(observed.length,6);
 callback();callback();callback();assert.equal(timers.length,1);
});

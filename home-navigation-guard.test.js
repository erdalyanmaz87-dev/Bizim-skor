const assert=require('assert');
const ui=require('./header-ui.js');

assert.strictEqual(typeof ui.hasUnsavedPredictionChanges,'function');
assert.strictEqual(typeof ui.navigateHome,'function');

function section({hidden=false,inputs=[]}={}){
  return {
    classList:{contains:name=>name==='hide'&&hidden},
    querySelectorAll:()=>inputs
  };
}
function input(value,defaultValue,disabled=false){return{value,defaultValue,disabled};}

const cleanPred=section({inputs:[input('2','2'),input('1','1')]});
const dirtyPred=section({inputs:[input('3','2'),input('1','1')]});
const hiddenDirtyPred=section({hidden:true,inputs:[input('3','2')]});
const cleanChampions=section({inputs:[input('1','1'),input('0','0')]});
const dirtyChampions=section({inputs:[input('2','1'),input('0','0')]});

function docWith({pred,championsPred,homeButton}){
  return {
    getElementById:id=>id==='pred'?pred:id==='championsPred'?championsPred:null,
    querySelector:()=>homeButton||null
  };
}

assert.strictEqual(ui.hasUnsavedPredictionChanges(docWith({pred:cleanPred,championsPred:cleanChampions})),false);
assert.strictEqual(ui.hasUnsavedPredictionChanges(docWith({pred:dirtyPred,championsPred:cleanChampions})),true);
assert.strictEqual(ui.hasUnsavedPredictionChanges(docWith({pred:hiddenDirtyPred,championsPred:dirtyChampions})),true);

let clicked=0,confirmCalls=0;
const homeButton={click:()=>clicked++};
const dirtyDoc=docWith({pred:dirtyPred,championsPred:section({hidden:true}),homeButton});
assert.strictEqual(ui.navigateHome(dirtyDoc,()=>{confirmCalls++;return false;}),false);
assert.strictEqual(clicked,0);
assert.strictEqual(confirmCalls,1);
assert.strictEqual(ui.navigateHome(dirtyDoc,()=>{confirmCalls++;return true;}),true);
assert.strictEqual(clicked,1);

const cleanDoc=docWith({pred:cleanPred,championsPred:section({hidden:true}),homeButton});
assert.strictEqual(ui.navigateHome(cleanDoc,()=>{throw new Error('clean navigation must not confirm');}),true);
assert.strictEqual(clicked,2);

console.log('home navigation guard ok');

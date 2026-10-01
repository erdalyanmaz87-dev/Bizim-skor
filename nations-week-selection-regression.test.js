const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function harness(){
 const select={value:'3',options:[{value:'3'},{value:'4'}]},title={},state={},box={},save={classList:{add(){},remove(){}}};
 const nodes={nationsPredictionWeekSelect:select,nationsPredTitle:title,nationsState:state,nationsFixtures:box,nationsSave:save,pred:{},nationsPred:{classList:{add(){},remove(){}}},nationsLeagueStyles:{}};
 const calls=[];
 const context={module:{exports:{}},document:{getElementById:id=>nodes[id],querySelectorAll:()=>[],querySelector:()=>null},localStorage:{getItem:()=> 'token'},sb:{rpc:async(name,args)=>{calls.push(args.p_week);return{data:[]}}},Event:class{},dispatchEvent(){}};
 vm.runInNewContext(fs.readFileSync('nations-league-ui.js','utf8'),context);
 return{api:context.module.exports,select,title,calls};
}
test('reopening an obsolete week uses the visible active week',async()=>{
 const h=harness();await h.api.openPrediction(1);
 assert.equal(h.calls.at(-1),3);assert.equal(h.api.currentWeek(),3);assert.match(h.title.textContent,/3\. Hafta/);assert.equal(h.select.value,'3');
});
test('opening another available week synchronizes the picker',async()=>{
 const h=harness();await h.api.openPrediction(4);
 assert.equal(h.calls.at(-1),4);assert.equal(h.select.value,'4');assert.match(h.title.textContent,/4\. Hafta/);
});
test('opening Nations through competition navigation without a week loads the selected week',async()=>{
 const h=harness();await h.api.loadPrediction();
 assert.equal(h.calls.at(-1),3);assert.equal(h.api.currentWeek(),3);assert.match(h.title.textContent,/3\. Hafta/);
});

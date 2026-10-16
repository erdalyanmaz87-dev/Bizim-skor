const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('decorating the same prediction view twice does not rewrite its unchanged rule',async()=>{
 let writes=0,html='';const note={get innerHTML(){return html},set innerHTML(value){html=value;writes++}};
 const button={},row={querySelector:s=>(s==='[data-robot-one]'||s==='[data-robot-quick]')?button:null};
 const anchor={querySelector:()=>note};
 const document={readyState:'loading',addEventListener(){},querySelectorAll:s=>s==='#fx .m'?[row]:[],getElementById:id=>id==='robotPredictionStyles'?{}:id==='fx'?{parentElement:anchor}:null};
 const context={document,localStorage:{getItem:()=>null},BizimSkorRobotPrediction:{robotLimit:()=>1},BizimSkorPredictionContext:()=>({week:8,fixtures:[{id:1}]})};
 vm.runInNewContext(fs.readFileSync('robot-prediction-ui.js','utf8'),context);
 await context.BizimSkorRobotUI.decorate();await context.BizimSkorRobotUI.decorate();
 assert.equal(writes,1);assert(html.includes('SkorBot'));
});

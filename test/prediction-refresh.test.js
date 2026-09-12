const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const source=html.slice(html.lastIndexOf('async function renderPredictionArea('),html.indexOf('\nfunction normalizePlayerName',html.lastIndexOf('async function renderPredictionArea(')));
function setup(){
  const nodes={};
  for(const id of ['predictionState','fx','save','week'])nodes[id]={dataset:{},classList:{add(){},remove(){}},textContent:'',addEventListener(){}};
  Object.defineProperty(nodes.fx,'innerHTML',{get(){return this.html||''},set(value){this.html=value;this.inputs=[...value.matchAll(/<input[^>]*id="([^"]+)"[^>]*value="([^"]*)"/g)].map(m=>({id:m[1],value:m[2],disabled:m[0].includes('disabled'),dataset:{}}))}});
  nodes.fx.querySelector=()=>nodes.fx.inputs?.find(x=>!x.disabled)||null;
  let name='Alice';
  const ctx=vm.createContext({document:{getElementById:id=>nodes[id]||nodes.fx.inputs?.find(x=>x.id===id)},localStorage:{getItem:()=>name},selectedPredictionWeek:5,fixtures:[{id:41,home_team:'Home',away_team:'Away'}],editing:false,locked:false,mine:[],esc:String});
  vm.runInContext('async function getMyPredictions(){return mine} function weekLocked(){return locked}\n'+source,ctx);
  return {ctx,nodes,setName:n=>name=n,render:(...args)=>ctx.renderPredictionArea(...args)};
}
test('background refresh retains partial input, zero, focus node and robot metadata',async()=>{
  const s=setup();await s.render();const input=s.nodes.fx.inputs[0];input.value='0';input.dataset.robotScore='0';
  await s.render();assert.equal(s.nodes.fx.inputs[0],input);assert.equal(input.value,'0');assert.equal(input.dataset.robotScore,'0');assert.equal(s.nodes.fx.inputs[1].value,'');
});
test('editing saved predictions stays open during refresh; successful save can reset it',async()=>{
  const s=setup();s.ctx.mine=[{fixture_id:41,home_score:1,away_score:1}];await s.render(true);s.nodes.fx.inputs[0].value='3';
  await s.render();assert.equal(s.nodes.fx.inputs[0]?.value,'3');assert.equal(s.ctx.editing,true);
  s.ctx.mine=[{fixture_id:41,home_score:3,away_score:1}];await s.render(false,false);assert.equal(s.nodes.fx.inputs.length,0);assert.match(s.nodes.predictionState.innerHTML,/3-1/);
});
test('deadline still locks the form and shows saved values',async()=>{
  const s=setup();await s.render();s.nodes.fx.inputs[0].value='3';s.ctx.locked=true;await s.render();assert.equal(s.nodes.fx.inputs[0].disabled,true);assert.equal(s.nodes.fx.inputs[0].value,'');
});
test('another week or player never inherits the current inputs',async()=>{
  const s=setup();await s.render();s.nodes.fx.inputs[0].value='3';s.ctx.selectedPredictionWeek=6;await s.render();assert.equal(s.nodes.fx.inputs[0].value,'');
  s.nodes.fx.inputs[0].value='2';s.setName('Bob');await s.render();assert.equal(s.nodes.fx.inputs[0].value,'');
});
test('a response for a previous week cannot overwrite the new week',async()=>{
  const s=setup();await s.render();let resolve;s.ctx.getMyPredictions=()=>new Promise(r=>resolve=r);const pending=s.render();
  s.ctx.selectedPredictionWeek=6;s.ctx.getMyPredictions=async()=>[];await s.render();s.nodes.fx.inputs[0].value='4';resolve([]);await pending;assert.equal(s.nodes.fx.inputs[0].value,'4');
});

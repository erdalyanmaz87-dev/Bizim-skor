const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(allowed=true){
 const events=[];
 const root={document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:()=> 'session'},sb:{
  async rpc(name,args){events.push({name,args});return{data:allowed,error:null}},
  from(){events.push({name:'read-score'});return{select(){return this},eq(){return this},async maybeSingle(){return{data:{home_score:3,away_score:2}}}}}
 }};
 root.globalThis=root;vm.runInNewContext(fs.readFileSync('robot-prediction-ui.js','utf8'),root);
 return{api:root.BizimSkorRobotUI,events};
}
test('both suggestion modes check quota before reading the shared score',async()=>{
 const {api,events}=setup();
 const a=await api.prepareSuggestion({id:22},{kind:'champions',week:3});
 const b=await api.prepareSuggestion({id:22},{kind:'champions',week:3});
 assert.deepEqual(JSON.parse(JSON.stringify(a)),{homeScore:3,awayScore:2});
 assert.equal(a,b);
 assert.equal(events[0].name,'claim_skorbot_preview');
 assert.equal(events[0].args.p_competition,'champions_league');
 assert.equal(events.filter(e=>e.name==='read-score').length,1);
 assert.equal(events.filter(e=>e.name==='claim_skorbot_preview').length,2);
});
test('quota denial never reads or exposes the score',async()=>{
 const {api,events}=setup(false);
 await assert.rejects(()=>api.prepareSuggestion({id:22},{kind:'champions',week:3}),/hakkın doldu/);
 assert.deepEqual(events.map(e=>e.name),['claim_skorbot_preview']);
});

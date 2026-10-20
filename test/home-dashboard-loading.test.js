const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup({champions,ratio}={}){
 const nodes=Object.fromEntries(['bsHomeDashboard','bsWeekRank','bsChampionsRank','bsNationsRank','bsGeneralRank','bsCorrectRate','personalWeekRank','personalGeneralRank','personalRanks'].map(id=>[id,{textContent:'Yükleniyor…',dataset:{},setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]}}]));
 nodes.personalWeekRank.textContent='2.';nodes.personalGeneralRank.textContent='3.';
 const calls=[];
 const context={module:{exports:{}},console:{warn(){}},Date,Promise,setTimeout,clearTimeout,MutationObserver:class{observe(){}},localStorage:{getItem:k=>k==='bizimSkorName'?'Erdal':k==='bizimSkorFriendToken'?'test-session':null},document:{getElementById:id=>nodes[id]||null,querySelector:()=>null,querySelectorAll:()=>[]},sb:{rpc:async name=>{calls.push(name);if(name==='get_champions_league_ranking')return champions?champions.promise:{data:[{player_name:'Erdal',league_rank:4}]};if(name==='get_nations_league_ranking')return{data:[{player_name:'Erdal',league_rank:5}]};if(name.includes('directory'))return{data:[{name:'Erdal'},{name:'İpek'}]};return{data:[]}},from:table=>({select:()=>table==='predictions'?{eq:()=>ratio?ratio.promise:Promise.resolve({data:[]})}:Promise.resolve({data:[]})})}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../home-dashboard-ui.js'),'utf8'),context);
 return{api:context.module.exports,nodes,calls,context};
}
test('a failed competition does not erase successful ranking cards',async()=>{
 const champions=deferred(),{api,nodes}=setup({champions});
 const loading=api.refresh();await tick();champions.reject(new Error('temporary timeout'));await loading;
 assert.equal(nodes.bsNationsRank.textContent,'5. / 1');
 assert.equal(nodes.bsGeneralRank.textContent,'3. / 2');
 assert.notEqual(nodes.bsChampionsRank.textContent,'Yükleniyor…');
});
test('rankings appear while the history ratio request is still pending',async()=>{
 const ratio=deferred(),{api,nodes}=setup({ratio});
 const loading=api.refresh();await tick();
 assert.equal(nodes.bsChampionsRank.textContent,'4. / 1');
 ratio.resolve({data:[]});await loading;
});
test('overlapping refresh events share one request batch',async()=>{
 const champions=deferred(),{api,calls}=setup({champions});
 const first=api.refresh(),second=api.refresh();await tick();
 assert.equal(calls.filter(x=>x==='get_champions_league_ranking').length,1);
 champions.resolve({data:[]});await Promise.all([first,second]);
});

test('a brief focus return reuses the loaded dashboard',async()=>{
 const {api,calls}=setup();await api.refresh();const count=calls.length;await api.refresh();
 assert.equal(calls.length,count);
});
test('a failed refresh preserves the last successful competition rank',async()=>{
 const {api,nodes,context}=setup();await api.refresh();
 const rpc=context.sb.rpc;context.sb.rpc=async name=>name==='get_champions_league_ranking'?{error:new Error('timeout')}:rpc(name);
 await api.refresh(true);
 assert.equal(nodes.bsChampionsRank.textContent,'4. / 1');
 assert.equal(nodes.bsChampionsRank.dataset.dashboardRetry,'1');
});

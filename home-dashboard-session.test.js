const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
const showName=code.match(/function showName\(n\)\{[^\n]+\}/)[0];
const logout=code.match(/document\.getElementById\('logoutPlayer'\)\.onclick=\(\)=>\{[^\n]+\}/)[0];
const values=new Map(),nodes=new Map();
const make=(id,text='')=>{const node={id,textContent:text,innerHTML:'',dataset:{},classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){},insertAdjacentElement(){},contains(){return false},querySelector(){return null}};nodes.set(id,node);return node;};
for(const id of ['bsHomeDashboard','dailyMatches','bsWeekRank','bsChampionsRank','bsNationsRank','bsGeneralRank','bsCorrectRate','personalWeekRank','personalGeneralRank','personalWeekRankLabel','bsWeekRankLabel','logoutPlayer','knownPlayer','newPlayer','loginName','loginPin'])make(id,id.startsWith('personal')?'1.':'');
make('personalRanks').dataset.bsDashboardWatch='1';
const context=vm.createContext({
 module:{exports:{}},localStorage:{getItem:key=>values.get(key)||null,removeItem:key=>values.delete(key)},
 document:{getElementById:id=>nodes.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[]},
 sb:{rpc:async method=>({data:method==='list_player_ranking_directory'?[{name:values.get('bizimSkorName'),is_active:true}]:method.includes('_ranking')?[{player_name:values.get('bizimSkorName'),league_rank:1}]:[],error:null}),from:()=>({select(){return this},eq(){return this},then(resolve){resolve({data:[],error:null})}})},
 BizimSkorStartup:{showRememberedPlayer(){}},refreshPersonalRanks(){return Promise.resolve()},closeProfileForm(){},renderPredictionArea(){},confirm:()=>true,console,Date
});
context.window=context;
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'home-dashboard-ui.js'),'utf8'),context);
context.BizimSkorHomeDashboard=context.module.exports;
vm.runInContext(showName+'\n'+logout,context);
(async()=>{
 await context.BizimSkorHomeDashboard.refresh();
 assert.equal(nodes.get('bsCorrectRate').textContent,'Giriş yapınca görünecek');
 values.set('bizimSkorName','Erdal');values.set('bizimSkorFriendToken','test-session');
 vm.runInContext("showName('Erdal')",context);
 await new Promise(setImmediate);
 assert.equal(nodes.get('bsCorrectRate').dataset.dashboardReady,'1','login should replace guest dashboard with player statistics');
 assert.match(nodes.get('bsCorrectRate').innerHTML,/bs-rate-breakdown/);
 assert.notEqual(nodes.get('bsChampionsRank').textContent,'Giriş yapınca görünecek');
 nodes.get('logoutPlayer').onclick();
 await new Promise(setImmediate);
 assert.equal(nodes.get('bsCorrectRate').textContent,'Giriş yapınca görünecek','logout should clear previous player statistics');
 assert.equal(nodes.get('bsCorrectRate').dataset.dashboardReady,undefined);
 console.log('PASS: login refreshes dashboard statistics and logout clears them');
})().catch(error=>{console.error(error);process.exitCode=1});

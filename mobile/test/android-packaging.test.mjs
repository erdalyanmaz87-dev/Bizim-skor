import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ui=require('../android-ui.js');const read=n=>readFile(new URL('../www/'+n,import.meta.url),'utf8');
test('all seven requested Android areas are present in the final native bundle',async()=>{
 const html=await read('index.html');assert.match(html,/src="android-ui.js"/);assert.match(html,/src="native-reminders.js"/);assert.match(html,/daily-ranking-link.js/);assert.match(html,/scoring-version-utils.js/);
 const flags=new Set(Object.values(ui.codes));for(const code of flags)assert.match(await read('flags/'+code+'.svg'),/<svg/);assert.match(await read('flags/LICENSE.txt'),/MIT License/);
 const nav=require('../www/simple-navigation.js');const drawer=nav.drawerMarkup([{key:'account',title:'Hesabım',items:[]}],{loggedIn:true});assert.match(drawer,/Hesap Ayarları/);
});
test('native player profile keeps all four scoring symbols in every competition',()=>{
 const profile=require('../www/player-profile.js');for(const competition of ['super_lig','champions_league','nations_league']){
  const base={scoring_version:2,real_home:3,real_away:1};
  for(const [home,away,symbol] of [[3,1,'🎯'],[2,0,'🥅'],[4,0,'🔢'],[2,1,'✅']])assert.equal(profile.matchSymbol({...base,predicted_home:home,predicted_away:away},competition),symbol);
 }
});

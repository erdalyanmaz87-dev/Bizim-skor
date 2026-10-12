const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('Champions statistics follow the displayed row id even when fixture array order differs',()=>{
 let button;const row={querySelector(selector){return selector.includes('clh')?{id:'clh22'}:null},appendChild(node){button=node}};
 const context={module:{exports:{}},document:{querySelectorAll:s=>s==='#championsFixtures .champions-match'?[row]:[],createElement:()=>({dataset:{},addEventListener(){}})},BizimSkorChampionsUI:{getFixtures:()=>[{id:99}]}};
 vm.runInNewContext(fs.readFileSync('match-statistics-ui.js','utf8'),context);context.module.exports.injectButtons();
 assert.equal(button.dataset.matchStatistics,'22');
});

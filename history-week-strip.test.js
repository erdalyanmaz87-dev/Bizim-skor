const assert=require('assert');
const ui=require('./history-week-strip.js');
assert.deepStrictEqual(ui.availableWeeks([{week:4},{week:2},{week:4},{week:3}]),[2,3,4]);
assert.strictEqual(ui.pickHistoryWeek([2,3,4],4),4);
assert.strictEqual(ui.pickHistoryWeek([2,3,4],5),4);
assert.strictEqual(ui.pickHistoryWeek([2,3,4],null),4);
assert.strictEqual(typeof ui.historyChoices,'function');
assert.deepStrictEqual(ui.historyChoices([2,3,4],true),[
 {type:'super',week:2,label:'2. Hafta'},
 {type:'super',week:3,label:'3. Hafta'},
 {type:'super',week:4,label:'4. Hafta'},
 {type:'champions',week:1,label:'⭐ ŞL 1. Hafta'}
]);
assert.deepStrictEqual(ui.historyChoices([2,3],false).map(x=>x.label),['2. Hafta','3. Hafta']);
console.log('history-week-strip ok');

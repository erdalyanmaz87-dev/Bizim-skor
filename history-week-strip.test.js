const assert=require('assert');
const ui=require('./history-week-strip.js');
assert.deepStrictEqual(ui.availableWeeks([{week:4},{week:2},{week:4},{week:3}]),[2,3,4]);
assert.strictEqual(ui.pickHistoryWeek([2,3,4],4),4);
assert.strictEqual(ui.pickHistoryWeek([2,3,4],5),4);
assert.strictEqual(ui.pickHistoryWeek([2,3,4],null),4);
console.log('history-week-strip ok');

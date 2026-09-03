const assert=require('assert');
const ui=require('./weekly-ranking-strip.js');
assert.deepStrictEqual(ui.availableWeeks([{week:2},{week:4},{week:3},{week:4}]),[2,3,4]);
assert.strictEqual(ui.currentWeek([2,3,4],4),4);
assert.strictEqual(ui.currentWeek([2,3,4],5),4);
assert.strictEqual(ui.currentWeek([2,3,4],null),4);
console.log('weekly-ranking-strip ok');

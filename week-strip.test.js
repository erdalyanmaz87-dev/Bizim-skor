const assert=require('assert');
const ui=require('./week-strip.js');
assert.deepStrictEqual(ui.normalizeWeeks([5,2,4,5,3]),[2,3,4,5]);
assert.strictEqual(ui.pickInitialWeek([2,3,4,5],5),5);
assert.strictEqual(ui.pickInitialWeek([2,3,4],5),4);
assert.ok(ui.renderWeekStrip([2,3,4,5],5).includes('data-week="5"'));
assert.ok(ui.renderWeekStrip([2,3,4,5],5).includes('is-current'));
console.log('week-strip ok');

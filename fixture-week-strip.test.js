const assert=require('assert');
const ui=require('./fixture-week-strip.js');
assert.deepStrictEqual(ui.availableWeeks([{week:5},{week:3},{week:4},{week:5}]),[3,4,5]);
assert.strictEqual(ui.pickFixtureWeek([3,4,5],4),4);
assert.strictEqual(ui.pickFixtureWeek([3,4,5],6),5);
assert.strictEqual(ui.pickFixtureWeek([3,4,5],null),5);
console.log('fixture-week-strip ok');

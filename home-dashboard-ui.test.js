const assert=require('assert');
const ui=require('./home-dashboard-ui.js');
assert.deepStrictEqual(ui.resultSummary([
 {home_score:2,away_score:1,real_home:1,real_away:0},
 {home_score:1,away_score:1,real_home:2,real_away:2},
 {home_score:0,away_score:1,real_home:1,real_away:0},
 {home_score:3,away_score:2,real_home:null,real_away:null}
]),{correct:2,total:3,percent:67});
assert.strictEqual(ui.rankChange(8,11),'↑3');
assert.strictEqual(ui.rankChange(11,8),'↓3');
assert.strictEqual(ui.rankChange(8,8),'—');
assert.strictEqual(ui.rankText(8,42),'8. / 42');
assert.strictEqual(ui.shouldShowSezu(3),true);
assert.strictEqual(ui.shouldShowSezu(4),false);
console.log('home dashboard helpers ok');

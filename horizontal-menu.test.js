const assert=require('assert');
const ui=require('./horizontal-menu.js');
assert.deepStrictEqual(
  ui.orderMenuTabs(['chat','general','history','sezu','live','friendLeagues','rules','resultsWeek','footballCenter']),
  ['live','sezu','general','resultsWeek','footballCenter','friendLeagues','history','rules','chat']
);
assert.strictEqual(ui.menuLabel('resultsWeek'),'Fikstür');
assert.strictEqual(ui.menuLabel('history'),'Tahmin Geçmişim');
assert.strictEqual(ui.isPrimaryTab('pred'),true);
assert.strictEqual(ui.isPrimaryTab('home'),true);
assert.strictEqual(ui.isPrimaryTab('chat'),false);
console.log('horizontal-menu ok');

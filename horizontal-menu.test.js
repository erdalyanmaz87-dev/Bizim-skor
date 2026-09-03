const assert=require('assert');
const ui=require('./horizontal-menu.js');
assert.deepStrictEqual(
  ui.orderMenuTabs(['chat','general','history','sezu','weeklyRankings','friendLeagues','rules','resultsWeek','footballCenter','championsRanking','championsPred']),
  ['championsRanking','weeklyRankings','sezu','general','resultsWeek','footballCenter','friendLeagues','history','rules','chat']
);
assert.deepStrictEqual(
  ui.orderMenuTabs(['chat','general','live','resultsWeek','championsRanking']),
  ['championsRanking','live','general','resultsWeek','chat']
);
assert.strictEqual(ui.menuLabel('championsRanking'),'⭐ Şampiyonlar Ligi Sıralaması');
assert.strictEqual(ui.menuLabel('weeklyRankings'),'Hafta Sıralaması');
assert.strictEqual(ui.menuLabel('live'),'Hafta Sıralaması');
assert.strictEqual(ui.menuLabel('resultsWeek'),'Fikstür');
assert.strictEqual(ui.menuLabel('history'),'Tahmin Geçmişim');
assert.strictEqual(ui.isPrimaryTab('pred'),true);
assert.strictEqual(ui.isPrimaryTab('home'),true);
assert.strictEqual(ui.isPrimaryTab('chat'),false);
console.log('horizontal-menu ok');

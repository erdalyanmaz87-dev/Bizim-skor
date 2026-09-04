const assert=require('assert');
const ui=require('./horizontal-menu.js');
assert.deepStrictEqual(
  ui.orderMenuTabs(['chat','general','history','sezu','weeklyRankings','friendLeagues','rules','resultsWeek','footballCenter','championsRanking','championsPred']),
  ['championsRanking','general','weeklyRankings','sezu','resultsWeek','footballCenter','friendLeagues','history','rules','chat']
);
assert.deepStrictEqual(
  ui.orderMenuTabs(['chat','general','live','resultsWeek','championsRanking']),
  ['championsRanking','general','live','resultsWeek','chat']
);
assert.strictEqual(ui.menuLabel('championsRanking'),'Şampiyonlar Ligi Genel Sıralaması');
assert.strictEqual(ui.menuLabel('general'),'Süper Lig Genel Sıralaması');
assert.strictEqual(ui.menuLabel('weeklyRankings'),'Haftalık Sıralama');
assert.strictEqual(ui.menuLabel('live'),'Haftalık Sıralama');
assert.strictEqual(ui.menuLabel('sezu'),'Sezu');
assert.strictEqual(ui.menuLabel('resultsWeek'),'Fikstür');
assert.strictEqual(ui.menuLabel('friendLeagues'),'Arkadaş Ligi');
assert.strictEqual(ui.menuIcon('championsRanking'),'⚽');
assert.strictEqual(ui.menuIcon('general'),'🇹🇷');
assert.strictEqual(ui.menuLabel('history'),'Tahmin Geçmişim');
assert.strictEqual(ui.isPrimaryTab('pred'),true);
assert.strictEqual(ui.isPrimaryTab('home'),true);
assert.strictEqual(ui.isPrimaryTab('chat'),false);
console.log('horizontal-menu ok');

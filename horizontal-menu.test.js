const assert=require('assert');
const ui=require('./horizontal-menu.js');
assert.deepStrictEqual(
  ui.orderMenuTabs(['chat','general','history','sezu','weeklyRankings','friendLeagues','rules','resultsWeek','footballCenter']),
  ['weeklyRankings','sezu','general','resultsWeek','footballCenter','friendLeagues','history','rules','chat']
);
assert.deepStrictEqual(
  ui.orderMenuTabs(['chat','general','live','resultsWeek']),
  ['live','general','resultsWeek','chat']
);
assert.strictEqual(ui.menuLabel('weeklyRankings'),'Hafta Sıralaması');
assert.strictEqual(ui.menuLabel('live'),'Hafta Sıralaması');
assert.strictEqual(ui.menuLabel('resultsWeek'),'Fikstür');
assert.strictEqual(ui.menuLabel('history'),'Tahmin Geçmişim');
assert.strictEqual(ui.menuLabel('sezu'),'Sezu Ödül Sıralaması');
assert.strictEqual(ui.menuIcon('weeklyRankings'),'📊');
assert.strictEqual(ui.menuIcon('general'),'🥇');
assert.strictEqual(ui.menuIcon('resultsWeek'),'📅');
assert.strictEqual(ui.menuIcon('footballCenter'),'📈');
assert.strictEqual(ui.menuIcon('friendLeagues'),'👥');
assert.strictEqual(ui.menuIcon('history'),'📝');
assert.strictEqual(ui.menuIcon('rules'),'📜');
assert.strictEqual(ui.menuIcon('chat'),'💬');
assert.strictEqual(ui.isPrimaryTab('pred'),true);
assert.strictEqual(ui.isPrimaryTab('home'),true);
assert.strictEqual(ui.isPrimaryTab('chat'),false);
console.log('horizontal-menu ok');

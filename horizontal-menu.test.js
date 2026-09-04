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
assert.strictEqual(ui.menuIcon('championsRanking'),'⭐');
assert.strictEqual(ui.menuLabel('weeklyRankings'),'Hafta Sıralaması');
assert.strictEqual(ui.menuLabel('live'),'Hafta Sıralaması');
assert.strictEqual(ui.menuLabel('resultsWeek'),'Fikstür');
assert.strictEqual(ui.menuIcon('resultsWeek'),'📅');
assert.strictEqual(ui.menuLabel('general'),'Süper Lig Genel Sıralaması');
assert.strictEqual(ui.menuIcon('general'),'🇹🇷');
assert.strictEqual(ui.menuLabel('sezu'),'Sezu Genel Sıralaması');
assert.strictEqual(ui.menuIcon('sezu'),'🏆');
assert.strictEqual(ui.menuDirection(),'column');
assert.strictEqual(ui.tabMarkup('championsRanking'),'<span class="bs-menu-icon" aria-hidden="true">⭐</span><span class="bs-menu-label">Şampiyonlar Ligi Genel Sıralaması</span>');
assert.strictEqual(ui.tabMarkup('general'),'<span class="bs-menu-icon" aria-hidden="true">🇹🇷</span><span class="bs-menu-label">Süper Lig Genel Sıralaması</span>');
assert.strictEqual(ui.tabMarkup('resultsWeek'),'<span class="bs-menu-icon" aria-hidden="true">📅</span><span class="bs-menu-label">Fikstür</span>');
assert.strictEqual(ui.menuLabel('history'),'Tahmin Geçmişim');
assert.strictEqual(ui.isPrimaryTab('pred'),true);
assert.strictEqual(ui.isPrimaryTab('home'),true);
assert.strictEqual(ui.isPrimaryTab('chat'),false);
console.log('horizontal-menu ok');

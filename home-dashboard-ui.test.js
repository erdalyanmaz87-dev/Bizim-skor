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
assert.strictEqual(ui.shouldShowSezu(4),true);
assert.strictEqual(ui.shouldShowSezu(99),true);
assert.strictEqual(ui.generalRankingLabel(),'Süper Lig Genel Sıralaması');
assert.strictEqual(typeof ui.applyGeneralRankingLabels,'function');
const menuLabel={textContent:'Genel Sıralama'};
const heading={textContent:'🏆 Genel Sıralama'};
ui.applyGeneralRankingLabels({querySelector:selector=>selector==='[data-tab="general"]'?menuLabel:selector==='#general h2'?heading:null});
assert.strictEqual(menuLabel.textContent,'Süper Lig Genel Sıralaması');
assert.strictEqual(heading.textContent,'🏆 Süper Lig Genel Sıralaması');

const nodes={
 personalWeekRank:{textContent:'8.'},personalSezuRank:{textContent:'9.'},personalGeneralRank:{textContent:'10.'},
 personalWeekRankLabel:{textContent:'3. Hafta Süper Lig Sıralaması'},
 bsWeekRank:{textContent:''},bsSezuRank:{textContent:''},bsGeneralRank:{textContent:''},
 bsWeekRankLabel:{textContent:''}
};
global.document={getElementById:id=>nodes[id]||null};
ui.syncRanks(62);
assert.strictEqual(nodes.bsWeekRankLabel.textContent,'3. Hafta Süper Lig Sıralaması');
console.log('home dashboard helpers ok');

const assert=require('assert');
const ui=require('./home-dashboard-ui.js');
const order=require('./home-dashboard-order.js');
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
assert.strictEqual(ui.shouldShowSezu(3),false);
assert.strictEqual(ui.shouldShowSezu(4),false);
assert.strictEqual(ui.shouldShowSezu(99),false);
assert.strictEqual(ui.generalRankingLabel(),'Süper Lig Genel Sıralaması');
assert.strictEqual(ui.championsRankingLabel(),'Şampiyonlar Ligi Genel Sıralaması');
assert.deepStrictEqual(order.ORDER,['champions','general','nations','league','rate']);

const cards=Object.fromEntries(order.ORDER.map(kind=>[kind,{kind}]));
const appended=[];
const wrap={
  querySelector:selector=>cards[selector.split('.').pop()]||null,
  appendChild:card=>appended.push(card.kind)
};
assert.strictEqual(order.reorderDashboard({querySelector:selector=>selector==='#bsHomeDashboard .bs-home-stats'?wrap:null}),true);
assert.deepStrictEqual(appended,['champions','general','nations','league','rate']);

const nodes={
 personalWeekRank:{textContent:'8.'},personalGeneralRank:{textContent:'10.'},
 personalWeekRankLabel:{textContent:'4. Hafta Süper Lig Sıralaması'},
 bsWeekRank:{textContent:''},bsChampionsRank:{textContent:''},bsGeneralRank:{textContent:''},
 bsWeekRankLabel:{textContent:''}
};
global.document={getElementById:id=>nodes[id]||null};
ui.syncRanks(73,{rank:4,total:45});
assert.strictEqual(nodes.bsWeekRankLabel.textContent,'4. Hafta Süper Lig Sıralaması');
assert.strictEqual(nodes.bsChampionsRank.textContent,'4. / 45');
console.log('home dashboard helpers ok');

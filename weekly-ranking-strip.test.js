const assert=require('assert');
const ui=require('./weekly-ranking-strip.js');
assert.deepStrictEqual(ui.availableWeeks([{week:2},{week:4},{week:3},{week:4}]),[2,3,4]);
assert.strictEqual(ui.currentWeek([2,3,4],4),4);
assert.strictEqual(ui.currentWeek([2,3,4],5),4);
assert.strictEqual(ui.currentWeek([2,3,4],null),4);
assert.strictEqual(typeof ui.latestScoredWeek,'function');
const fixtures=[{id:21,week:3},{id:31,week:4},{id:41,week:5}];
assert.strictEqual(ui.latestScoredWeek(fixtures,[{fixture_id:21,home_score:1,away_score:0}]),3);
assert.strictEqual(ui.latestScoredWeek(fixtures,[{fixture_id:21,home_score:1,away_score:0},{fixture_id:31,home_score:0,away_score:0}]),4);
assert.strictEqual(ui.latestScoredWeek(fixtures,[]),null);
assert.match(ui.renderCompetitionSwitch('champions_league'),/data-weekly-competition="champions_league"/);
assert.match(ui.renderCompetitionSwitch('nations_league'),/data-weekly-competition="nations_league"/);
assert.match(ui.renderCompetitionSwitch('nations_league'),/>UEFA Uluslar Ligi</);
assert.deepStrictEqual(ui.championsWeeklyArgs('token-1',2),{p_token:'token-1',p_season:'2026/27',p_week:2});
assert.deepStrictEqual(ui.nationsWeeklyArgs('token-1',2),{p_token:'token-1',p_season:'2026/27',p_week:2});
assert.deepStrictEqual(ui.nationsWeeklyArgs('token-1','bad'),{p_token:'token-1',p_season:'2026/27',p_week:1});
const markup=ui.championsWeeklyRankingMarkup([{league_rank:1,player_name:'Ayşegül',points:8,exact_count:1,correct_count:2,participant_count:45,completed_count:1,fixture_count:18}],2);
assert.doesNotMatch(markup,/Oyuncu adına dokununca/);
assert.doesNotMatch(markup,/0\/18 maç sonuçlandı/);
assert.match(markup,/data-profile-kind="champions"/);
assert.match(markup,/data-profile-week="2"/);
assert.match(markup,/Ayşegül/);
const nations=ui.nationsWeeklyRankingMarkup([{league_rank:1,player_name:'Erdal',points:0,exact_count:0,correct_count:0}],1);
assert.match(nations,/data-profile-kind="nations"/);
assert.match(nations,/Erdal/);
const summaries=ui.nationsMatchSummariesMarkup([
 {fixture_id:1,home_team:'Türkiye',away_team:'Fransa',player_name:'Erdal',predicted_home:2,predicted_away:1,real_home:2,real_away:1},
 {fixture_id:1,home_team:'Türkiye',away_team:'Fransa',player_name:'Fahri',predicted_home:1,predicted_away:0,real_home:2,real_away:1}
]);
assert.match(summaries,/Maç Maç Bilenler/);
assert.match(summaries,/Türkiye 2 - 1 Fransa/);
assert.match(summaries,/Doğru skor tahmini yapanlar:<\/b> Erdal/);
assert.match(summaries,/Doğru sonucu bilen:<\/b> 2 kişi/);
assert.match(ui.championsMatchSummariesMarkup([]),/Maçlar tamamlandıkça/);
console.log('weekly-ranking-strip ok');

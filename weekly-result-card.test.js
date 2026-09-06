const test = require('node:test');
const assert = require('node:assert/strict');
const { buildWeeklyResultCardModel, whatsappShareText } = require('./weekly-result-card');

test('builds every approved weekly result card field', () => {
  const model = buildWeeklyResultCardModel({
    player: 'Erdal', week: 5,
    stats: { points: 18, exact: 2, correct: 5 },
    weeklyRank: 3, overallRank: 7, previousOverallRank: 10,
    inviteUrl: 'https://bizimskor.app/?invite=p1'
  });

  assert.deepEqual(model, {
    player: 'Erdal', week: 5, points: 18, exact: 2, correct: 5,
    weeklyRank: 3, overallRank: 7,
    movement: { direction: 'up', value: 3, label: '▲ 3' },
    inviteUrl: 'https://bizimskor.app/?invite=p1'
  });
});

test('movement reports down and unchanged ranks', () => {
  assert.equal(buildWeeklyResultCardModel({ player:'A', week:1, stats:{}, overallRank:9, previousOverallRank:4 }).movement.direction, 'down');
  assert.equal(buildWeeklyResultCardModel({ player:'A', week:1, stats:{}, overallRank:4, previousOverallRank:4 }).movement.direction, 'same');
});

test('WhatsApp share contains the personal invite URL', () => {
  const model = buildWeeklyResultCardModel({
    player: 'Erdal', week: 5, stats: { points: 18 }, weeklyRank: 3,
    overallRank: 7, previousOverallRank: 10,
    inviteUrl: 'https://bizimskor.app/?invite=p1'
  });
  assert.match(whatsappShareText(model), /https:\/\/bizimskor\.app\/\?invite=p1/);
});

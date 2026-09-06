const test = require('node:test');
const assert = require('node:assert/strict');
const { selectMonthlyInviteChampion } = require('./invite-champion');

test('selects the first ranked player as monthly champion', () => {
  const champion = selectMonthlyInviteChampion([
    { inviterId: 'p1', name: 'Ali', count: 4, rank: 1 },
    { inviterId: 'p2', name: 'Bora', count: 3, rank: 2 }
  ]);
  assert.equal(champion.inviterId, 'p1');
});

test('returns null for an empty month', () => {
  assert.equal(selectMonthlyInviteChampion([]), null);
});

test('uses leaderboard order to resolve an already deterministic tie', () => {
  const champion = selectMonthlyInviteChampion([
    { inviterId: 'p2', name: 'Ali', count: 3, rank: 1 },
    { inviterId: 'p1', name: 'Zeynep', count: 3, rank: 2 }
  ]);
  assert.equal(champion.name, 'Ali');
});

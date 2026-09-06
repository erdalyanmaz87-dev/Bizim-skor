const test = require('node:test');
const assert = require('node:assert/strict');
const { buildInviteLeaderboard } = require('./invite-leaderboard');

const rows = [
  { inviterId: 'p2', name: 'Zeynep', createdAt: '2026-08-31T23:59:59Z' },
  { inviterId: 'p1', name: 'Ali', createdAt: '2026-09-01T00:00:00Z' },
  { inviterId: 'p2', name: 'Zeynep', createdAt: '2026-09-10T12:00:00Z' },
  { inviterId: 'p1', name: 'Ali', createdAt: '2026-09-30T23:59:59Z' },
  { inviterId: 'p3', name: 'Bora', createdAt: '2026-10-01T00:00:00Z' }
];

test('monthly leaderboard includes only the requested calendar month', () => {
  assert.deepEqual(buildInviteLeaderboard(rows, { type: 'month', year: 2026, month: 9 }), [
    { inviterId: 'p1', name: 'Ali', count: 2, rank: 1 },
    { inviterId: 'p2', name: 'Zeynep', count: 1, rank: 2 }
  ]);
});

test('season leaderboard aggregates all valid rows', () => {
  const board = buildInviteLeaderboard(rows, { type: 'season' });
  assert.equal(board.find(x => x.inviterId === 'p1').count, 2);
  assert.equal(board.find(x => x.inviterId === 'p2').count, 2);
  assert.equal(board.find(x => x.inviterId === 'p3').count, 1);
});

test('ties are deterministic by Turkish display name', () => {
  const board = buildInviteLeaderboard(rows, { type: 'season' });
  assert.deepEqual(board.slice(0, 2).map(x => x.name), ['Ali', 'Zeynep']);
});

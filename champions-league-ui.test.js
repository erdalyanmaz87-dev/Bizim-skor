const assert = require('assert');

// RED: one-time CL unlock must be available only for the targeted player
// and must be consumed after a successful full-week save.
const { canUseOneTimeChampionsUnlock, consumeOneTimeChampionsUnlock } = require('./champions-league-one-time-unlock');

const grant = {
  playerId: 'hafsa-player-id',
  season: '2026/27',
  week: 1,
  consumed: false,
};

assert.equal(
  canUseOneTimeChampionsUnlock(grant, { playerId: 'hafsa-player-id', season: '2026/27', week: 1 }),
  true,
  'targeted player should receive the one-time CL unlock'
);

assert.equal(
  canUseOneTimeChampionsUnlock(grant, { playerId: 'someone-else', season: '2026/27', week: 1 }),
  false,
  'other players must remain locked'
);

const consumed = consumeOneTimeChampionsUnlock(grant);
assert.equal(consumed.consumed, true, 'successful save should consume the grant');
assert.equal(
  canUseOneTimeChampionsUnlock(consumed, { playerId: 'hafsa-player-id', season: '2026/27', week: 1 }),
  false,
  'consumed grant must not allow a second edit'
);

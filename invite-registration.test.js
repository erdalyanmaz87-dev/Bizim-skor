const test = require('node:test');
const assert = require('node:assert/strict');
const { consumePendingInvite } = require('./invite-registration');

test('game invite records attribution without joining a league', async () => {
  const calls = [];
  const result = await consumePendingInvite({
    newPlayerId: 'p2',
    invite: { inviterId: 'p1', leagueId: null },
    api: {
      async recordInvite(payload) { calls.push(['recordInvite', payload]); return { recorded: true }; },
      async joinLeague(payload) { calls.push(['joinLeague', payload]); }
    }
  });

  assert.deepEqual(result, { recorded: true });
  assert.deepEqual(calls, [[
    'recordInvite',
    { inviterId: 'p1', invitedPlayerId: 'p2', leagueId: null }
  ]]);
});

test('league invite records attribution then joins the selected league', async () => {
  const calls = [];
  await consumePendingInvite({
    newPlayerId: 'p2',
    invite: { inviterId: 'p1', leagueId: 'l9' },
    api: {
      async recordInvite(payload) { calls.push(['recordInvite', payload]); return { recorded: true }; },
      async joinLeague(payload) { calls.push(['joinLeague', payload]); return { joined: true }; }
    }
  });

  assert.deepEqual(calls, [
    ['recordInvite', { inviterId: 'p1', invitedPlayerId: 'p2', leagueId: 'l9' }],
    ['joinLeague', { leagueId: 'l9', playerId: 'p2' }]
  ]);
});

test('duplicate attribution retry is safe and does not join again', async () => {
  let joinCalls = 0;
  const result = await consumePendingInvite({
    newPlayerId: 'p2',
    invite: { inviterId: 'p1', leagueId: 'l9' },
    api: {
      async recordInvite() { return { recorded: false, reason: 'duplicate' }; },
      async joinLeague() { joinCalls += 1; }
    }
  });

  assert.equal(result.recorded, false);
  assert.equal(joinCalls, 0);
});

test('self invite is rejected before any API call', async () => {
  let apiCalls = 0;
  const result = await consumePendingInvite({
    newPlayerId: 'p1',
    invite: { inviterId: 'p1', leagueId: 'l9' },
    api: {
      async recordInvite() { apiCalls += 1; return { recorded: true }; },
      async joinLeague() { apiCalls += 1; }
    }
  });

  assert.deepEqual(result, { recorded: false, reason: 'invalid' });
  assert.equal(apiCalls, 0);
});

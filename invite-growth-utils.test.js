const test = require('node:test');
const assert = require('node:assert/strict');
const { buildInviteLink, parseInviteParams, isValidInviteAttribution } = require('./invite-growth-utils');

test('builds a game invite link', () => {
  assert.equal(buildInviteLink('https://bizimskor.app', 'p1'), 'https://bizimskor.app/?invite=p1');
});

test('builds a league invite link', () => {
  assert.equal(buildInviteLink('https://bizimskor.app/', 'p1', 'l9'), 'https://bizimskor.app/?invite=p1&league=l9');
});

test('parses invite parameters', () => {
  assert.deepEqual(parseInviteParams('https://x.test/?invite=p1&league=l9'), { inviterId: 'p1', leagueId: 'l9' });
});

test('rejects duplicate attribution', () => {
  assert.equal(isValidInviteAttribution('p1', 'p2', { inviterId: 'p3' }), false);
});

test('rejects self invite', () => {
  assert.equal(isValidInviteAttribution('p1', 'p1', null), false);
});

test('accepts first valid attribution', () => {
  assert.equal(isValidInviteAttribution('p1', 'p2', null), true);
});

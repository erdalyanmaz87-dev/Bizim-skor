const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('./shot-yikim-engine.js');

test('initial state uses approved v1 balance and starts at round one', () => {
  const state = engine.createInitialState();
  assert.equal(state.status, 'ready');
  assert.equal(state.round, 1);
  assert.equal(state.score, 0);
  assert.equal(state.shotsRemaining, 5);
  assert.equal(state.targets.length, 3);
  assert.ok(state.targets.every(target => target.hp === 1 && target.destroyed === false));
});

test('near-zero shot is invalid and does not spend a shot', () => {
  const state = engine.createInitialState();
  const outcome = engine.resolveShot(state, {
    start: { x: 0.5, y: 0.86 },
    end: { x: 0.501, y: 0.859 }
  });
  assert.equal(outcome.result.valid, false);
  assert.equal(outcome.state.shotsRemaining, 5);
  assert.equal(outcome.state.score, 0);
});

test('valid hit destroys one target, spends one shot and awards 250 points', () => {
  const state = engine.createInitialState();
  const outcome = engine.resolveShot(state, { start: { x: 0.5, y: 0.88 }, end: { x: 0.28, y: 0.31 } });
  assert.equal(outcome.result.valid, true);
  assert.equal(outcome.result.hitTargetId, 'target-1');
  assert.equal(outcome.result.destroyedTargetId, 'target-1');
  assert.equal(outcome.state.shotsRemaining, 4);
  assert.equal(outcome.state.score, 250);
  assert.equal(outcome.state.targets[0].destroyed, true);
});

test('last target awards round bonus and completes round', () => {
  const state = engine.createInitialState();
  state.targets[0].destroyed = true; state.targets[0].hp = 0;
  state.targets[1].destroyed = true; state.targets[1].hp = 0;
  const outcome = engine.resolveShot(state, { start: { x: 0.5, y: 0.88 }, end: { x: 0.72, y: 0.31 } });
  assert.equal(outcome.state.status, 'round-complete');
  assert.equal(outcome.state.score, 550);
});

test('next round preserves score, increments round and refreshes targets and shots', () => {
  const state = engine.createInitialState();
  state.score = 1050;
  state.status = 'round-complete';
  state.shotsRemaining = 2;
  state.targets.forEach(target => { target.hp = 0; target.destroyed = true; });
  const next = engine.startNextRound(state);
  assert.equal(next.round, 2);
  assert.equal(next.score, 1050);
  assert.equal(next.status, 'ready');
  assert.equal(next.shotsRemaining, 5);
  assert.ok(next.targets.every(target => target.hp === 1 && target.destroyed === false));
});

test('missing with the final shot ends the game when targets remain', () => {
  const state = engine.createInitialState();
  state.shotsRemaining = 1;
  const outcome = engine.resolveShot(state, { start: { x: 0.5, y: 0.88 }, end: { x: 0.05, y: 0.05 } });
  assert.equal(outcome.state.shotsRemaining, 0);
  assert.equal(outcome.state.status, 'game-over');
});

test('reset returns a clean round-one state', () => {
  const reset = engine.resetGame();
  assert.deepEqual(reset, engine.createInitialState());
});
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('./shot-yikim-engine.js');

function signature(level) {
  return level.targets.map(t => [t.x,t.y,t.radius,t.hp,t.shape,t.material,t.moving ? 1 : 0].join(':')).join('|');
}

test('campaign contains exactly 20 unique levels', () => {
  assert.equal(engine.LEVELS.length, 20);
  assert.equal(new Set(engine.LEVELS.map(signature)).size, 20);
});

test('level one starts simple with three one-hit targets and generous shots', () => {
  const state = engine.startGame();
  assert.equal(state.round, 1);
  assert.equal(state.targets.length, 3);
  assert.ok(state.targets.every(target => target.hp === 1));
  assert.ok(state.shotsRemaining >= 4);
});

test('later campaign gets denser and introduces strong and moving targets', () => {
  const first = engine.LEVELS[0];
  const middle = engine.LEVELS[10];
  const final = engine.LEVELS[19];
  assert.ok(middle.targets.length > first.targets.length);
  assert.ok(engine.LEVELS.slice(5).some(level => level.targets.some(target => target.hp > 1)));
  assert.ok(engine.LEVELS.slice(10).some(level => level.targets.some(target => target.moving)));
  assert.ok(final.targets.length >= 9);
  assert.ok(final.targets.some(target => target.hp >= 2));
});

test('every level has enough shots to be mathematically completable', () => {
  for (const level of engine.LEVELS) {
    const requiredHits = level.targets.reduce((sum, target) => sum + target.hp, 0);
    assert.ok(level.shots >= requiredHits, `level ${level.id} needs ${requiredHits}, has ${level.shots}`);
  }
});

test('next round changes layout and preserves score', () => {
  const state = engine.startGame();
  state.score = 1250;
  state.status = 'round-complete';
  const next = engine.startNextRound(state);
  assert.equal(next.round, 2);
  assert.equal(next.score, 1250);
  assert.notEqual(signature(engine.LEVELS[0]), signature(engine.LEVELS[1]));
});

test('finishing round twenty marks the campaign complete', () => {
  const state = engine.createStateForRound(20, 9999, 'playing');
  state.targets.forEach((target, index) => {
    if (index < state.targets.length - 1) {
      target.hp = 0;
      target.destroyed = true;
    }
  });
  const target = state.targets[state.targets.length - 1];
  target.hp = 1;
  const outcome = engine.resolveShot(state, {
    start: { x: 0.5, y: 0.88 },
    end: { x: target.x, y: target.y }
  });
  assert.equal(outcome.state.status, 'game-complete');
  assert.equal(outcome.state.round, 20);
});

test('reset returns campaign to level one', () => {
  const reset = engine.resetGame();
  assert.equal(reset.round, 1);
  assert.equal(reset.score, 0);
  assert.equal(reset.phase, 'playing');
});
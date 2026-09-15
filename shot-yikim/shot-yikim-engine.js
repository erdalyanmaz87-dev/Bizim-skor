(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShotYikimEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const CONFIG = Object.freeze({ shots: 5, hitScore: 100, destroyBonus: 150, roundBonus: 300, minShotPower: 0.03 });
  const TARGETS = Object.freeze([
    { id: 'target-1', x: 0.28, y: 0.31, radius: 0.075 },
    { id: 'target-2', x: 0.50, y: 0.22, radius: 0.075 },
    { id: 'target-3', x: 0.72, y: 0.31, radius: 0.075 }
  ]);

  function createInitialState() {
    return {
      status: 'ready',
      score: 0,
      shotsRemaining: CONFIG.shots,
      targets: TARGETS.map(target => ({ ...target, hp: 1, destroyed: false })),
      lastShot: null
    };
  }

  function shotPower(shot) {
    const dx = Number(shot?.end?.x) - Number(shot?.start?.x);
    const dy = Number(shot?.end?.y) - Number(shot?.start?.y);
    return Math.hypot(dx, dy);
  }

  function isValidShot(shot) {
    return Number.isFinite(shotPower(shot)) && shotPower(shot) >= CONFIG.minShotPower;
  }

  function lineHitsTarget(shot, target) {
    const ax = Number(shot.start.x), ay = Number(shot.start.y);
    const bx = Number(shot.end.x), by = Number(shot.end.y);
    const abx = bx - ax, aby = by - ay;
    const lengthSq = abx * abx + aby * aby;
    if (!lengthSq) return false;
    const projection = ((target.x - ax) * abx + (target.y - ay) * aby) / lengthSq;
    const t = Math.max(0, Math.min(1, projection));
    const px = ax + abx * t, py = ay + aby * t;
    return Math.hypot(target.x - px, target.y - py) <= target.radius;
  }

  function resolveShot(state, shot) {
    if (!isValidShot(shot) || state.status === 'round-complete' || state.status === 'game-over') {
      return { state, result: { valid: false, hitTargetId: null, destroyedTargetId: null } };
    }

    const next = {
      ...state,
      targets: state.targets.map(target => ({ ...target })),
      shotsRemaining: Math.max(0, state.shotsRemaining - 1),
      lastShot: { start: { ...shot.start }, end: { ...shot.end } }
    };

    let hitTargetId = null;
    let destroyedTargetId = null;
    const target = next.targets.find(candidate => !candidate.destroyed && lineHitsTarget(shot, candidate));

    if (target) {
      hitTargetId = target.id;
      target.hp = Math.max(0, target.hp - 1);
      next.score += CONFIG.hitScore;
      if (target.hp === 0) {
        target.destroyed = true;
        destroyedTargetId = target.id;
        next.score += CONFIG.destroyBonus;
      }
    }

    const allDestroyed = next.targets.every(candidate => candidate.destroyed);
    if (allDestroyed) {
      next.status = 'round-complete';
      next.score += CONFIG.roundBonus;
    } else if (next.shotsRemaining === 0) {
      next.status = 'game-over';
    } else {
      next.status = 'playing';
    }

    return { state: next, result: { valid: true, hitTargetId, destroyedTargetId } };
  }

  function resetGame() { return createInitialState(); }

  return Object.freeze({ CONFIG, createInitialState, isValidShot, lineHitsTarget, resolveShot, resetGame });
});
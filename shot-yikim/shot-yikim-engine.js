(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShotYikimEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const CONFIG = Object.freeze({ maxRounds: 20, fallenScore: 100, roundBonus: 500 });
  const TABLE_TOP = 0.62;

  function row(levelId, rowIndex, count, options = {}) {
    const material = options.material || 'stone';
    const shape = options.shape || 'rect';
    const h = options.h || (shape === 'circle' ? 0.066 : 0.054);
    const w = options.w || (shape === 'circle' ? h : 0.115);
    const spacing = options.spacing || Math.min(0.118, 0.68 / Math.max(1, count - 1));
    const offset = options.offset || 0;
    const y = TABLE_TOP - 0.032 - rowIndex * 0.061;
    const startX = 0.5 - ((count - 1) * spacing) / 2 + offset;
    return Array.from({ length: count }, (_, index) => ({
      id: `l${levelId}-r${rowIndex}-b${index}`,
      x: Number((startX + index * spacing).toFixed(4)),
      y: Number(y.toFixed(4)),
      w,
      h,
      shape,
      material,
      angle: options.angle || 0
    }));
  }

  function makeLevel(id, name, shots, rows) {
    const blocks = rows.flatMap((spec, rowIndex) => row(id, rowIndex, spec.count, spec));
    return Object.freeze({ id, name, shots, blocks: Object.freeze(blocks.map(block => Object.freeze(block))) });
  }

  const LEVELS = Object.freeze([
    makeLevel(1, 'Isınma', 5, [{ count: 2, material: 'wood' }, { count: 1, material: 'stone' }]),
    makeLevel(2, 'İki Kat', 5, [{ count: 2, material: 'wood' }, { count: 2, material: 'stone' }]),
    makeLevel(3, 'Piramit', 6, [{ count: 3, material: 'stone' }, { count: 2, material: 'wood' }, { count: 1, material: 'stone' }]),
    makeLevel(4, 'Metal Tepe', 6, [{ count: 3, material: 'wood' }, { count: 2, material: 'stone' }, { count: 1, material: 'metal' }]),
    makeLevel(5, 'Dişli Kule', 7, [{ count: 3, material: 'stone' }, { count: 3, material: 'wood', offset: 0.025 }, { count: 1, material: 'metal', shape: 'circle' }]),
    makeLevel(6, 'Geniş Taban', 7, [{ count: 4, material: 'wood', spacing: 0.105 }, { count: 3, material: 'stone', spacing: 0.108 }, { count: 2, material: 'metal', spacing: 0.12 }]),
    makeLevel(7, 'Dört Kat', 8, [{ count: 4, material: 'stone', spacing: 0.105 }, { count: 3, material: 'wood' }, { count: 2, material: 'stone' }, { count: 1, material: 'metal' }]),
    makeLevel(8, 'Yuvarlak Tehlike', 8, [{ count: 4, material: 'wood', spacing: 0.105 }, { count: 3, material: 'stone' }, { count: 2, material: 'metal', shape: 'circle', spacing: 0.13 }, { count: 1, material: 'stone' }]),
    makeLevel(9, 'Kale Kapısı', 9, [{ count: 5, material: 'stone', spacing: 0.095 }, { count: 4, material: 'wood', spacing: 0.102 }, { count: 2, material: 'metal', spacing: 0.14 }]),
    makeLevel(10, 'İlk Final', 9, [{ count: 5, material: 'wood', spacing: 0.095 }, { count: 4, material: 'stone', spacing: 0.1 }, { count: 3, material: 'metal', spacing: 0.11 }, { count: 1, material: 'stone', shape: 'circle' }]),
    makeLevel(11, 'Ağır Merkez', 10, [{ count: 5, material: 'stone', spacing: 0.095 }, { count: 4, material: 'wood' }, { count: 3, material: 'stone' }, { count: 2, material: 'metal', spacing: 0.13 }]),
    makeLevel(12, 'Çift Tepe', 10, [{ count: 5, material: 'wood', spacing: 0.095 }, { count: 5, material: 'stone', spacing: 0.095, offset: 0.02 }, { count: 3, material: 'metal', spacing: 0.12 }, { count: 2, material: 'stone', shape: 'circle', spacing: 0.14 }]),
    makeLevel(13, 'Dar Boğaz', 10, [{ count: 5, material: 'stone', spacing: 0.095 }, { count: 4, material: 'metal', spacing: 0.105 }, { count: 4, material: 'wood', spacing: 0.105, offset: 0.025 }, { count: 2, material: 'stone' }]),
    makeLevel(14, 'Çifte Duvar', 11, [{ count: 6, material: 'wood', spacing: 0.09 }, { count: 5, material: 'stone', spacing: 0.095 }, { count: 4, material: 'metal', spacing: 0.105 }, { count: 2, material: 'wood', spacing: 0.14 }]),
    makeLevel(15, 'Yüksek Kule', 11, [{ count: 6, material: 'stone', spacing: 0.09 }, { count: 5, material: 'wood', spacing: 0.095 }, { count: 4, material: 'stone', spacing: 0.105 }, { count: 3, material: 'metal', spacing: 0.115 }, { count: 1, material: 'stone', shape: 'circle' }]),
    makeLevel(16, 'Metal Gövde', 12, [{ count: 6, material: 'wood', spacing: 0.09 }, { count: 5, material: 'metal', spacing: 0.095 }, { count: 4, material: 'stone', spacing: 0.105 }, { count: 3, material: 'metal', spacing: 0.115 }, { count: 2, material: 'wood', spacing: 0.14 }]),
    makeLevel(17, 'Sarsılmaz mı?', 12, [{ count: 6, material: 'stone', spacing: 0.09 }, { count: 6, material: 'wood', spacing: 0.09, offset: 0.025 }, { count: 5, material: 'stone', spacing: 0.095 }, { count: 3, material: 'metal', spacing: 0.115 }, { count: 2, material: 'stone', shape: 'circle', spacing: 0.14 }]),
    makeLevel(18, 'Zırhlı Piramit', 13, [{ count: 7, material: 'wood', spacing: 0.082 }, { count: 6, material: 'stone', spacing: 0.09 }, { count: 5, material: 'metal', spacing: 0.095 }, { count: 4, material: 'stone', spacing: 0.105 }, { count: 2, material: 'metal', shape: 'circle', spacing: 0.14 }]),
    makeLevel(19, 'Yarı Final', 13, [{ count: 7, material: 'stone', spacing: 0.082 }, { count: 6, material: 'metal', spacing: 0.09 }, { count: 5, material: 'wood', spacing: 0.095 }, { count: 4, material: 'stone', spacing: 0.105 }, { count: 3, material: 'metal', spacing: 0.115 }]),
    makeLevel(20, 'Büyük Final', 14, [{ count: 7, material: 'wood', spacing: 0.082 }, { count: 7, material: 'stone', spacing: 0.082, offset: 0.02 }, { count: 6, material: 'metal', spacing: 0.09 }, { count: 5, material: 'stone', spacing: 0.095 }, { count: 4, material: 'wood', spacing: 0.105 }, { count: 3, material: 'metal', spacing: 0.115 }])
  ]);

  function levelFor(round) { return LEVELS[Math.min(Math.max(Number(round) || 1, 1), LEVELS.length) - 1]; }
  function createStateForRound(round, score = 0, phase = 'playing') {
    const safeRound = Math.min(Math.max(Number(round) || 1, 1), LEVELS.length);
    const level = levelFor(safeRound);
    return { status: 'ready', phase, round: safeRound, levelName: level.name, score: Number(score) || 0, shotsRemaining: level.shots, maxRounds: LEVELS.length };
  }
  function createInitialState() { return createStateForRound(1, 0, 'menu'); }
  function startGame() { return createStateForRound(1, 0, 'playing'); }
  function recordShot(state) { return { ...state, phase: 'playing', status: 'playing', shotsRemaining: Math.max(0, state.shotsRemaining - 1) }; }
  function recordFallen(state, count) { return { ...state, score: state.score + Math.max(0, Number(count) || 0) * CONFIG.fallenScore }; }
  function completeRound(state) { return { ...state, score: state.score + CONFIG.roundBonus, status: state.round >= LEVELS.length ? 'game-complete' : 'round-complete' }; }
  function failRound(state) { return { ...state, status: 'game-over' }; }
  function startNextRound(state) { return state.round >= LEVELS.length ? { ...state, status: 'game-complete' } : createStateForRound(state.round + 1, state.score, 'playing'); }
  function resetGame() { return startGame(); }

  return Object.freeze({ CONFIG, TABLE_TOP, LEVELS, createInitialState, createStateForRound, startGame, recordShot, recordFallen, completeRound, failRound, startNextRound, resetGame });
});
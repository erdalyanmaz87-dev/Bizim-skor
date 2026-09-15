(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.ShotYikimUI = api;
    if (root.document) root.document.addEventListener('DOMContentLoaded', () => api.mount(root.document));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  function statusText(state) {
    const round = Number(state?.round) || 1;
    if (state?.phase === 'menu') return "Başlamak için OYNA'ya bas.";
    if (state?.status === 'game-complete') return '20 bölüm tamamlandı! Bütün kuleleri yıktın! 🏆';
    if (state?.status === 'round-complete') return `${round}. bölüm tamamlandı! ${round + 1}. bölüm geliyor...`;
    if (state?.status === 'game-over') return `${round}. bölüm başarısız. Masada blok kaldı.`;
    if (state?.status === 'playing') return `${round}. bölüm: Kuleyi masadan aşağı indir.`;
    return `${round}. bölüm: İstediğin noktaya dokun ve şut çek.`;
  }

  function mount(doc) {
    const engine = root?.ShotYikimEngine;
    const physics = root?.ShotYikimPhysics;
    if (!engine || !physics) return false;

    const menu = doc.getElementById('shotYikimMenu');
    const start = doc.getElementById('shotYikimStart');
    const board = doc.getElementById('shotYikimBoard');
    const layer = doc.getElementById('shotYikimPhysicsLayer');
    const ball = doc.getElementById('shotYikimBall');
    const aimDot = doc.getElementById('shotYikimAimDot');
    const roundEl = doc.getElementById('shotYikimRound');
    const scoreEl = doc.getElementById('shotYikimScore');
    const shotsEl = doc.getElementById('shotYikimShots');
    const statusEl = doc.getElementById('shotYikimStatus');
    const restart = doc.getElementById('shotYikimRestart');
    const levelName = doc.getElementById('shotYikimLevelName');
    if (!menu || !start || !board || !layer || !ball || !aimDot || !roundEl || !scoreEl || !shotsEl || !statusEl || !restart || !levelName) return false;

    let state = engine.createInitialState();
    let world = null;
    let bodyEls = new Map();
    let shotLocked = false;
    let cleared = false;
    let timers = [];
    let seenFallen = new Set();

    const setTimer = (fn, delay) => {
      const id = root.setTimeout(fn, delay);
      timers.push(id);
      return id;
    };
    function clearTimers() {
      timers.forEach(id => root.clearTimeout?.(id));
      timers = [];
    }

    function level() { return engine.LEVELS[state.round - 1]; }

    function renderHud() {
      menu.hidden = state.phase !== 'menu';
      roundEl.textContent = String(state.round);
      scoreEl.textContent = String(state.score);
      shotsEl.textContent = String(state.shotsRemaining);
      levelName.textContent = `${state.round}. Bölüm · ${state.levelName || ''}`;
      statusEl.textContent = statusText(state);
      board.dataset.status = state.status;
      board.dataset.round = String(state.round);
    }

    function clearWorld() {
      clearTimers();
      world?.stop?.();
      world = null;
      layer.innerHTML = '';
      bodyEls = new Map();
      seenFallen = new Set();
      shotLocked = false;
      cleared = false;
      ball.classList.remove('is-live');
      ball.style.removeProperty('left');
      ball.style.removeProperty('top');
      ball.style.removeProperty('transform');
    }

    function makeBlockElement(block) {
      const el = doc.createElement('div');
      el.className = `physics-block material-${block.material} shape-${block.shape || 'rect'}`;
      el.dataset.blockId = block.id;
      el.style.width = `${block.w * 100}%`;
      el.style.height = `${block.h * 100}%`;
      layer.appendChild(el);
      return el;
    }

    function syncFrame(snapshot) {
      snapshot.blocks.forEach(body => {
        const el = bodyEls.get(body.label);
        if (!el) return;
        el.style.left = `${body.position.x}px`;
        el.style.top = `${body.position.y}px`;
        el.style.transform = `translate(-50%,-50%) rotate(${body.angle}rad)`;
        if (world?.fallenIds?.has(body.label)) el.classList.add('is-fallen');
      });
      const liveBall = snapshot.ball;
      if (liveBall) {
        ball.classList.add('is-live');
        ball.style.left = `${liveBall.position.x}px`;
        ball.style.top = `${liveBall.position.y}px`;
        ball.style.transform = `translate(-50%,-50%) rotate(${liveBall.angle}rad)`;
      } else {
        ball.classList.remove('is-live');
        ball.style.left = `${snapshot.origin.x}px`;
        ball.style.top = `${snapshot.origin.y}px`;
        ball.style.transform = 'translate(-50%,-50%)';
      }
    }

    function onFallen(ids) {
      const fresh = ids.filter(id => !seenFallen.has(id));
      if (!fresh.length) return;
      fresh.forEach(id => seenFallen.add(id));
      state = engine.recordFallen(state, fresh.length);
      renderHud();
    }

    function onCleared() {
      if (cleared || state.status === 'game-complete') return;
      cleared = true;
      state = engine.completeRound(state);
      renderHud();
      if (state.status === 'game-complete') return;
      setTimer(() => {
        state = engine.startNextRound(state);
        setupLevel();
      }, 1200);
    }

    function setupLevel() {
      clearWorld();
      renderHud();
      const rect = board.getBoundingClientRect();
      const current = level();
      current.blocks.forEach(block => bodyEls.set(block.id, makeBlockElement(block)));
      try {
        world = physics.createWorld({
          width: rect.width,
          height: rect.height,
          level: current,
          onFrame: syncFrame,
          onFallen,
          onCleared
        });
        world.start();
        statusEl.textContent = `${state.round}. bölüm: Nereye vurmak istiyorsan oraya dokun.`;
      } catch (error) {
        statusEl.textContent = 'Fizik motoru yüklenemedi. Sayfayı yenileyip tekrar dene.';
        console.error(error);
      }
    }

    function finishShotCycle() {
      world?.removeBall?.();
      setTimer(() => {
        shotLocked = false;
        if (!world || cleared || state.status === 'round-complete' || state.status === 'game-complete') return;
        const hasBlocksOnTable = world.blocks.some(body => !physics.isBodyOffTable(body, world.table));
        if (state.shotsRemaining === 0 && hasBlocksOnTable) {
          state = engine.failRound(state);
          renderHud();
        } else {
          statusEl.textContent = statusText(state);
        }
      }, 650);
    }

    function fire(event) {
      if (!world || shotLocked || state.phase === 'menu' || ['round-complete','game-over','game-complete'].includes(state.status) || state.shotsRemaining <= 0) return;
      const rect = board.getBoundingClientRect();
      const point = physics.boardPoint(event, rect);
      aimDot.style.left = `${point.x}px`;
      aimDot.style.top = `${point.y}px`;
      aimDot.classList.remove('pulse');
      void aimDot.offsetWidth;
      aimDot.classList.add('pulse');
      shotLocked = true;
      state = engine.recordShot(state);
      renderHud();
      statusEl.textContent = 'Şut! Kuleyi izle...';
      world.shoot(point);
      setTimer(finishShotCycle, 1450);
    }

    board.addEventListener('pointerup', fire);
    start.addEventListener('click', () => {
      state = engine.startGame();
      setupLevel();
    });
    restart.addEventListener('click', () => {
      const score = state.score;
      state = engine.createStateForRound(state.round, score, 'playing');
      setupLevel();
    });

    renderHud();
    return true;
  }

  return Object.freeze({ statusText, mount });
});
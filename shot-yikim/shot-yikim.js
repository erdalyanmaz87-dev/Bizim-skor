(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.ShotYikimUI = api;
    if (root.document) root.document.addEventListener('DOMContentLoaded', () => api.mount(root.document));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const clamp01 = value => Math.max(0, Math.min(1, value));
  const BALL_ORIGIN = Object.freeze({ x: 0.5, y: 0.88 });

  function pointFromEvent(event, board) {
    const rect = board.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height)
    };
  }

  function shotFromDrag(start, end) {
    return { start: { ...start }, end: { ...end } };
  }

  function statusText(state) {
    if (state.status === 'round-complete') return 'Tur Tamam! Tüm hedefleri yıktın.';
    if (state.status === 'game-over') return 'Oyun Bitti. Tekrar deneyebilirsin.';
    if (state.status === 'playing') return 'Devam! Kalan hedefleri vur.';
    return 'Nişan al ve ilk şutunu çek.';
  }

  function mount(doc) {
    const engine = root?.ShotYikimEngine;
    if (!engine) return false;
    const board = doc.getElementById('shotYikimBoard');
    const ball = doc.getElementById('shotYikimBall');
    const aim = doc.getElementById('shotYikimAim');
    const score = doc.getElementById('shotYikimScore');
    const shots = doc.getElementById('shotYikimShots');
    const status = doc.getElementById('shotYikimStatus');
    const restart = doc.getElementById('shotYikimRestart');
    const targets = doc.getElementById('shotYikimTargets');
    if (!board || !ball || !aim || !score || !shots || !status || !restart || !targets) return false;

    let state = engine.createInitialState();
    let activePointerId = null;

    function renderTargets() {
      const existing = new Map([...targets.querySelectorAll('[data-target-id]')].map(el => [el.dataset.targetId, el]));
      state.targets.forEach(target => {
        let el = existing.get(target.id);
        if (!el) {
          el = doc.createElement('div');
          el.className = 'shot-yikim__target';
          el.dataset.targetId = target.id;
          targets.appendChild(el);
        }
        el.style.left = `${target.x * 100}%`;
        el.style.top = `${target.y * 100}%`;
        el.classList.toggle('is-destroyed', target.destroyed);
      });
    }

    function render() {
      score.textContent = String(state.score);
      shots.textContent = String(state.shotsRemaining);
      status.textContent = statusText(state);
      board.dataset.status = state.status;
      renderTargets();
    }

    function updateAim(point) {
      const rect = board.getBoundingClientRect();
      const dx = (point.x - BALL_ORIGIN.x) * rect.width;
      const dy = (point.y - BALL_ORIGIN.y) * rect.height;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      aim.style.width = `${length}px`;
      aim.style.transform = `rotate(${angle}deg)`;
      aim.classList.add('is-visible');
    }

    function clearAim() {
      aim.classList.remove('is-visible');
      aim.style.width = '0px';
    }

    board.addEventListener('pointerdown', event => {
      if (state.status === 'round-complete' || state.status === 'game-over') return;
      activePointerId = event.pointerId;
      board.setPointerCapture?.(event.pointerId);
      updateAim(pointFromEvent(event, board));
    });

    board.addEventListener('pointermove', event => {
      if (activePointerId !== event.pointerId) return;
      updateAim(pointFromEvent(event, board));
    });

    board.addEventListener('pointerup', event => {
      if (activePointerId !== event.pointerId) return;
      const end = pointFromEvent(event, board);
      activePointerId = null;
      clearAim();
      const outcome = engine.resolveShot(state, shotFromDrag(BALL_ORIGIN, end));
      state = outcome.state;
      render();
    });

    board.addEventListener('pointercancel', event => {
      if (activePointerId !== event.pointerId) return;
      activePointerId = null;
      clearAim();
    });

    restart.addEventListener('click', () => {
      state = engine.resetGame();
      activePointerId = null;
      clearAim();
      render();
    });

    render();
    return true;
  }

  return Object.freeze({ clamp01, pointFromEvent, shotFromDrag, statusText, mount });
});
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

  function shotToTarget(target) {
    return shotFromDrag(BALL_ORIGIN, { x: Number(target.x), y: Number(target.y) });
  }

  function statusText(state) {
    const round = Number(state?.round) || 1;
    if (state.status === 'round-complete') return `Tur ${round} tamamlandı! ${round + 1}. tur geliyor...`;
    if (state.status === 'game-over') return `Oyun bitti. Tur ${round}'da kaldın.`;
    if (state.status === 'playing') return `Tur ${round}: Devam! Kalan hedeflere dokun.`;
    return `Tur ${round}: Bir hedefe dokun ve şutunu çek.`;
  }

  function mount(doc) {
    const engine = root?.ShotYikimEngine;
    if (!engine) return false;
    const board = doc.getElementById('shotYikimBoard');
    const ball = doc.getElementById('shotYikimBall');
    const score = doc.getElementById('shotYikimScore');
    const shots = doc.getElementById('shotYikimShots');
    const round = doc.getElementById('shotYikimRound');
    const status = doc.getElementById('shotYikimStatus');
    const restart = doc.getElementById('shotYikimRestart');
    const targets = doc.getElementById('shotYikimTargets');
    if (!board || !ball || !score || !shots || !round || !status || !restart || !targets) return false;

    let state = engine.createInitialState();
    let animating = false;
    let impactTimer = null;
    let unlockTimer = null;
    let roundTimer = null;
    const reduceMotion = Boolean(root?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    const impactDelay = reduceMotion ? 40 : 420;
    const returnDelay = reduceMotion ? 20 : 180;
    const roundDelay = reduceMotion ? 120 : 900;

    function clearTimers() {
      [impactTimer, unlockTimer, roundTimer].forEach(timer => timer && root.clearTimeout?.(timer));
      impactTimer = unlockTimer = roundTimer = null;
    }

    function renderTargets() {
      const existing = new Map([...targets.querySelectorAll('[data-target-id]')].map(el => [el.dataset.targetId, el]));
      state.targets.forEach(target => {
        let el = existing.get(target.id);
        if (!el) {
          el = doc.createElement('button');
          el.type = 'button';
          el.className = 'shot-yikim__target';
          el.dataset.targetId = target.id;
          el.setAttribute('aria-label', `${target.id.replace('target-', '')}. hedefe şut çek`);
          targets.appendChild(el);
        }
        el.style.left = `${target.x * 100}%`;
        el.style.top = `${target.y * 100}%`;
        el.classList.toggle('is-destroyed', target.destroyed);
        el.disabled = target.destroyed || animating || state.status === 'game-over' || state.status === 'round-complete';
      });
    }

    function render() {
      score.textContent = String(state.score);
      shots.textContent = String(state.shotsRemaining);
      round.textContent = String(state.round);
      status.textContent = statusText(state);
      board.dataset.status = state.status;
      renderTargets();
    }

    function resetBallPosition() {
      ball.classList.remove('is-shooting');
      ball.style.removeProperty('--shot-x');
      ball.style.removeProperty('--shot-y');
    }

    function animateBallTo(target) {
      const rect = board.getBoundingClientRect();
      const dx = (target.x - BALL_ORIGIN.x) * rect.width;
      const dy = (target.y - BALL_ORIGIN.y) * rect.height;
      ball.style.setProperty('--shot-x', `${dx}px`);
      ball.style.setProperty('--shot-y', `${dy}px`);
      void ball.offsetWidth;
      ball.classList.add('is-shooting');
    }

    function finishShot(target) {
      const outcome = engine.resolveShot(state, shotToTarget(target));
      state = outcome.state;
      render();
      resetBallPosition();

      if (state.status === 'round-complete') {
        roundTimer = root.setTimeout(() => {
          state = engine.startNextRound(state);
          animating = false;
          render();
        }, roundDelay);
        return;
      }

      unlockTimer = root.setTimeout(() => {
        animating = false;
        render();
      }, returnDelay);
    }

    function shootTarget(targetId) {
      if (animating || state.status === 'game-over' || state.status === 'round-complete') return false;
      const target = state.targets.find(candidate => candidate.id === targetId && !candidate.destroyed);
      if (!target) return false;
      animating = true;
      render();
      status.textContent = `Tur ${state.round}: Şut!`;
      animateBallTo(target);
      impactTimer = root.setTimeout(() => finishShot(target), impactDelay);
      return true;
    }

    targets.addEventListener('click', event => {
      const targetEl = event.target.closest?.('[data-target-id]');
      if (!targetEl) return;
      shootTarget(targetEl.dataset.targetId);
    });

    restart.addEventListener('click', () => {
      clearTimers();
      state = engine.resetGame();
      animating = false;
      resetBallPosition();
      render();
    });

    render();
    return true;
  }

  return Object.freeze({ clamp01, pointFromEvent, shotFromDrag, shotToTarget, statusText, mount });
});
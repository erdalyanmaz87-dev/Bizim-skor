(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.ShotYikimUI = api;
    if (root.document) root.document.addEventListener('DOMContentLoaded', () => api.mount(root.document));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const BALL_ORIGIN = Object.freeze({ x: 0.5, y: 0.88 });
  const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
  function pointFromEvent(event, board) {
    const rect = board.getBoundingClientRect();
    return { x: clamp01((event.clientX - rect.left) / rect.width), y: clamp01((event.clientY - rect.top) / rect.height) };
  }
  function shotFromDrag(start, end) { return { start: { ...start }, end: { ...end } }; }
  function shotToTarget(target) { return shotFromDrag(BALL_ORIGIN, { x: Number(target.x), y: Number(target.y) }); }
  function statusText(state) {
    const round = Number(state?.round) || 1;
    if (state?.phase === 'menu') return "Başlamak için OYNA'ya bas.";
    if (state.status === 'game-complete') return '20 bölüm tamamlandı! Şut Yıkım şampiyonusun! 🏆';
    if (state.status === 'round-complete') return `${round}. bölüm tamamlandı! ${round + 1}. bölüm geliyor...`;
    if (state.status === 'game-over') return `Toplar bitti. ${round}. bölümü tekrar dene.`;
    if (state.status === 'playing') return `${round}. bölüm: Kalan hedefleri vur.`;
    return `${round}. bölüm: Bir hedefe dokun ve şutunu çek.`;
  }

  function mount(doc) {
    const engine = root?.ShotYikimEngine;
    if (!engine) return false;
    const menu = doc.getElementById('shotYikimMenu'), start = doc.getElementById('shotYikimStart');
    const board = doc.getElementById('shotYikimBoard'), ball = doc.getElementById('shotYikimBall');
    const score = doc.getElementById('shotYikimScore'), shots = doc.getElementById('shotYikimShots'), round = doc.getElementById('shotYikimRound');
    const status = doc.getElementById('shotYikimStatus'), restart = doc.getElementById('shotYikimRestart'), targets = doc.getElementById('shotYikimTargets');
    const levelName = doc.getElementById('shotYikimLevelName');
    if (!menu || !start || !board || !ball || !score || !shots || !round || !status || !restart || !targets || !levelName) return false;

    let state = engine.createInitialState(), animating = false, timers = [];
    const reduceMotion = Boolean(root?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    const impactDelay = reduceMotion ? 30 : 360, unlockDelay = reduceMotion ? 20 : 170, roundDelay = reduceMotion ? 120 : 900;
    const setTimer = (fn, delay) => { const t = root.setTimeout(fn, delay); timers.push(t); return t; };
    const clearTimers = () => { timers.forEach(t => root.clearTimeout?.(t)); timers = []; };

    function resetBallPosition() {
      ball.classList.remove('is-shooting');
      ball.style.removeProperty('--shot-x'); ball.style.removeProperty('--shot-y');
    }
    function animateBallTo(target) {
      const rect = board.getBoundingClientRect();
      ball.style.setProperty('--shot-x', `${(target.x - BALL_ORIGIN.x) * rect.width}px`);
      ball.style.setProperty('--shot-y', `${(target.y - BALL_ORIGIN.y) * rect.height}px`);
      void ball.offsetWidth; ball.classList.add('is-shooting');
    }
    function renderTargets() {
      targets.innerHTML = '';
      state.targets.forEach(target => {
        const el = doc.createElement('button');
        el.type = 'button';
        el.className = `shot-yikim__target shape-${target.shape || 'block'} material-${target.material || 'stone'}`;
        if (target.destroyed) el.classList.add('is-destroyed');
        if (target.maxHp > 1) el.classList.add('is-strong');
        if (target.moving && !target.destroyed) el.classList.add('is-moving', `motion-${target.motion || 'horizontal'}`);
        el.dataset.targetId = target.id;
        el.style.left = `${target.x * 100}%`; el.style.top = `${target.y * 100}%`;
        el.style.setProperty('--target-w', `${(target.w || target.radius * 2.4) * 100}%`);
        el.style.setProperty('--target-h', `${(target.h || target.radius * 1.65) * 100}%`);
        el.style.setProperty('--target-rotation', `${target.rotation || 0}deg`);
        el.setAttribute('aria-label', `${state.round}. bölüm hedefi${target.maxHp > 1 ? `, ${target.hp} dayanıklılık` : ''}`);
        el.disabled = target.destroyed || animating || ['game-over','game-complete','round-complete'].includes(state.status);
        if (target.maxHp > 1 && !target.destroyed) {
          const badge = doc.createElement('span'); badge.className = 'shot-yikim__target-hp'; badge.textContent = String(target.hp); el.appendChild(badge);
        }
        targets.appendChild(el);
      });
    }
    function render() {
      menu.hidden = state.phase !== 'menu';
      score.textContent = String(state.score); shots.textContent = String(state.shotsRemaining); round.textContent = String(state.round);
      levelName.textContent = `${state.round}. Bölüm · ${state.levelName || ''}`;
      status.textContent = statusText(state); board.dataset.status = state.status; board.dataset.round = String(state.round);
      renderTargets();
    }
    function finishShot(target) {
      const outcome = engine.resolveTargetHit ? engine.resolveTargetHit(state, target.id) : engine.resolveShot(state, shotToTarget(target));
      state = outcome.state || outcome;
      render(); resetBallPosition();
      if (state.status === 'round-complete') {
        setTimer(() => { state = engine.startNextRound(state); animating = false; render(); }, roundDelay); return;
      }
      if (state.status === 'game-complete') { animating = false; render(); return; }
      setTimer(() => { animating = false; render(); }, unlockDelay);
    }
    function shootTarget(targetId) {
      if (animating || state.phase === 'menu' || ['game-over','game-complete','round-complete'].includes(state.status)) return false;
      const target = state.targets.find(candidate => candidate.id === targetId && !candidate.destroyed);
      if (!target) return false;
      animating = true; render(); status.textContent = `${state.round}. bölüm: Şut!`; animateBallTo(target);
      setTimer(() => finishShot(target), impactDelay); return true;
    }
    targets.addEventListener('click', event => {
      const targetEl = event.target.closest?.('[data-target-id]'); if (targetEl) shootTarget(targetEl.dataset.targetId);
    });
    start.addEventListener('click', () => { clearTimers(); state = engine.startGame(); animating = false; resetBallPosition(); render(); });
    restart.addEventListener('click', () => { clearTimers(); state = engine.resetGame(); animating = false; resetBallPosition(); render(); });
    render(); return true;
  }
  return Object.freeze({ clamp01, pointFromEvent, shotFromDrag, shotToTarget, statusText, mount });
});
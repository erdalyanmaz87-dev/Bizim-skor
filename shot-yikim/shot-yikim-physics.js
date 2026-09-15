(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShotYikimPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  function boardPoint(event, rect) {
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    };
  }

  function shotVelocity(origin, target, speed = 22) {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length * speed, y: dy / length * speed };
  }

  function isBodyOffTable(body, table) {
    const x = Number(body?.position?.x);
    const y = Number(body?.position?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    return y >= table.fallY || x <= table.left - 18 || x >= table.right + 18;
  }

  function allBlocksCleared(blocks, table) {
    return blocks.length > 0 && blocks.every(body => isBodyOffTable(body, table));
  }

  function materialOptions(material) {
    if (material === 'wood') return { density: 0.0017, friction: 0.72, frictionStatic: 0.88, restitution: 0.08 };
    if (material === 'metal') return { density: 0.0052, friction: 0.48, frictionStatic: 0.62, restitution: 0.04 };
    return { density: 0.0032, friction: 0.68, frictionStatic: 0.84, restitution: 0.035 };
  }

  function createWorld(options) {
    const Matter = root?.Matter;
    if (!Matter) throw new Error('Matter.js yüklenmedi');
    const { Engine, Bodies, Body, Composite } = Matter;
    const width = options.width;
    const height = options.height;
    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.25;

    const CATEGORY_BLOCK = 0x0001;
    const CATEGORY_PLATFORM = 0x0002;
    const CATEGORY_BALL = 0x0004;
    const tableWidth = width * 0.76;
    const tableHeight = Math.max(18, height * 0.028);
    const tableY = height * 0.62 + tableHeight / 2;
    const table = {
      left: (width - tableWidth) / 2,
      right: (width + tableWidth) / 2,
      top: tableY - tableHeight / 2,
      fallY: tableY + height * 0.12,
      y: tableY,
      width: tableWidth,
      height: tableHeight
    };

    const platformBody = Bodies.rectangle(width / 2, tableY, tableWidth, tableHeight, {
      isStatic: true,
      label: 'table',
      friction: 0.9,
      collisionFilter: { category: CATEGORY_PLATFORM, mask: CATEGORY_BLOCK }
    });
    const groundBody = Bodies.rectangle(width / 2, height * 0.965, width * 1.2, 34, {
      isStatic: true,
      label: 'ground',
      friction: 0.9,
      collisionFilter: { category: CATEGORY_PLATFORM, mask: CATEGORY_BLOCK }
    });
    const leftWall = Bodies.rectangle(-14, height / 2, 28, height, { isStatic: true, collisionFilter: { category: CATEGORY_PLATFORM, mask: CATEGORY_BLOCK } });
    const rightWall = Bodies.rectangle(width + 14, height / 2, 28, height, { isStatic: true, collisionFilter: { category: CATEGORY_PLATFORM, mask: CATEGORY_BLOCK } });
    Composite.add(engine.world, [platformBody, groundBody, leftWall, rightWall]);

    const blocks = options.level.blocks.map(block => {
      const x = block.x * width;
      const y = block.y * height;
      const w = block.w * width;
      const h = block.h * height;
      const opts = {
        ...materialOptions(block.material),
        label: block.id,
        angle: block.angle || 0,
        chamfer: block.shape === 'rect' ? { radius: Math.min(6, h * 0.15) } : undefined,
        collisionFilter: { category: CATEGORY_BLOCK, mask: CATEGORY_BLOCK | CATEGORY_PLATFORM | CATEGORY_BALL }
      };
      let body;
      if (block.shape === 'circle') body = Bodies.circle(x, y, Math.max(10, Math.min(w, h) / 2), opts);
      else if (block.shape === 'triangle') body = Bodies.polygon(x, y, 3, Math.max(w, h) / 2, opts);
      else body = Bodies.rectangle(x, y, w, h, opts);
      body.plugin = { ...(body.plugin || {}), blockId: block.id, material: block.material, shape: block.shape };
      return body;
    });
    Composite.add(engine.world, blocks);

    let ball = null;
    let running = false;
    let raf = null;
    let last = null;
    const origin = { x: width * 0.5, y: height * 0.86 };
    const fallenIds = new Set();

    function syncFallen() {
      const newly = [];
      for (const body of blocks) {
        if (!fallenIds.has(body.label) && isBodyOffTable(body, table)) {
          fallenIds.add(body.label);
          newly.push(body.label);
        }
      }
      if (newly.length) options.onFallen?.(newly);
      if (allBlocksCleared(blocks, table)) options.onCleared?.();
    }

    function frame(timestamp) {
      if (!running) return;
      const delta = Math.min(32, last ? timestamp - last : 16.666);
      last = timestamp;
      Engine.update(engine, delta);
      syncFallen();
      options.onFrame?.({ blocks, ball, table, origin });
      raf = root.requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      last = null;
      raf = root.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) root.cancelAnimationFrame(raf);
      raf = null;
      last = null;
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    }

    function shoot(target) {
      if (ball) Composite.remove(engine.world, ball);
      ball = Bodies.circle(origin.x, origin.y, Math.max(13, width * 0.042), {
        label: 'football',
        density: 0.0065,
        friction: 0.02,
        frictionAir: 0.002,
        restitution: 0.36,
        collisionFilter: { category: CATEGORY_BALL, mask: CATEGORY_BLOCK }
      });
      const velocity = shotVelocity(origin, target, 25);
      Body.setVelocity(ball, velocity);
      Body.setAngularVelocity(ball, velocity.x * 0.035);
      Composite.add(engine.world, ball);
      options.onBall?.(ball);
      return ball;
    }

    function removeBall() {
      if (!ball) return;
      Composite.remove(engine.world, ball);
      ball = null;
      options.onBall?.(null);
    }

    return Object.freeze({ engine, blocks, table, origin, start, stop, shoot, removeBall, getBall: () => ball, fallenIds });
  }

  return Object.freeze({ boardPoint, shotVelocity, isBodyOffTable, allBlocksCleared, createWorld });
});
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('standalone page exposes the required game surface and loads scripts in order', () => {
  const html = read('index.html');
  for (const id of ['shotYikimBoard','shotYikimBall','shotYikimAim','shotYikimScore','shotYikimShots','shotYikimStatus','shotYikimRestart','shotYikimTargets']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.ok(html.indexOf('shot-yikim-engine.js') < html.indexOf('shot-yikim.js'));
  assert.match(html, /shot-yikim\.css/);
});

test('styles are scoped and board is touch-safe', () => {
  const css = read('shot-yikim.css');
  assert.match(css, /\.shot-yikim/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /aspect-ratio/);
});

test('ui module normalizes pointer coordinates and derives a shot', () => {
  const ui = require('./shot-yikim.js');
  const board = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 400 }) };
  assert.deepEqual(ui.pointFromEvent({ clientX: 110, clientY: 220 }, board), { x: 0.5, y: 0.5 });
  assert.deepEqual(
    ui.shotFromDrag({ x: 0.5, y: 0.9 }, { x: 0.28, y: 0.31 }),
    { start: { x: 0.5, y: 0.9 }, end: { x: 0.28, y: 0.31 } }
  );
});

test('status copy covers all engine states', () => {
  const ui = require('./shot-yikim.js');
  assert.match(ui.statusText({ status: 'ready' }), /Nişan/);
  assert.match(ui.statusText({ status: 'playing' }), /Devam/);
  assert.match(ui.statusText({ status: 'round-complete' }), /Tamam/);
  assert.match(ui.statusText({ status: 'game-over' }), /Bitti/);
});
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('standalone page exposes tap-to-shoot game surface and round HUD', () => {
  const html = read('index.html');
  for (const id of ['shotYikimBoard','shotYikimBall','shotYikimScore','shotYikimShots','shotYikimRound','shotYikimStatus','shotYikimRestart','shotYikimTargets']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.ok(html.indexOf('shot-yikim-engine.js') < html.indexOf('shot-yikim.js'));
  assert.match(html, /Hedefe dokun/);
});

test('styles animate the ball and topple destroyed targets', () => {
  const css = read('shot-yikim.css');
  assert.match(css, /\.shot-yikim/);
  assert.match(css, /\.shot-yikim__ball\.is-shooting/);
  assert.match(css, /\.shot-yikim__target\.is-destroyed/);
  assert.match(css, /aspect-ratio/);
});

test('ui module normalizes pointer coordinates', () => {
  const ui = require('./shot-yikim.js');
  const board = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 400 }) };
  assert.deepEqual(ui.pointFromEvent({ clientX: 110, clientY: 220 }, board), { x: 0.5, y: 0.5 });
});

test('target tap creates a direct shot from ball origin to target center', () => {
  const ui = require('./shot-yikim.js');
  assert.deepEqual(ui.shotToTarget({ x: 0.28, y: 0.31 }), {
    start: { x: 0.5, y: 0.88 },
    end: { x: 0.28, y: 0.31 }
  });
});

test('status copy announces automatic next round', () => {
  const ui = require('./shot-yikim.js');
  assert.match(ui.statusText({ status: 'round-complete', round: 1 }), /2\. tur/);
  assert.match(ui.statusText({ status: 'ready', round: 2 }), /dokun/);
  assert.match(ui.statusText({ status: 'game-over', round: 2 }), /bitti/i);
});
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('opening screen is football themed and advertises 20 levels', () => {
  const html = read('index.html');
  for (const id of ['shotYikimMenu','shotYikimStart','shotYikimBoard','shotYikimBall','shotYikimRound','shotYikimScore','shotYikimShots','shotYikimStatus','shotYikimRestart','shotYikimTargets']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /20 Bölüm|20 bölüm/i);
  assert.match(html, /Futbol/i);
});

test('gameplay styles provide 3d materials and stadium presentation', () => {
  const css = read('shot-yikim.css');
  assert.match(css, /shot-yikim__stadium/);
  assert.match(css, /material-stone/);
  assert.match(css, /material-wood/);
  assert.match(css, /material-metal/);
  assert.match(css, /shape-wedge/);
  assert.match(css, /is-moving/);
  assert.match(css, /perspective/);
});

test('ui direct shot starts from the football origin', () => {
  const ui = require('./shot-yikim.js');
  assert.deepEqual(ui.shotToTarget({ x: 0.32, y: 0.30 }), {
    start: { x: 0.5, y: 0.88 },
    end: { x: 0.32, y: 0.30 }
  });
});

test('status copy distinguishes automatic next level and campaign win', () => {
  const ui = require('./shot-yikim.js');
  assert.match(ui.statusText({ status: 'round-complete', round: 4 }), /5\. bölüm/i);
  assert.match(ui.statusText({ status: 'game-complete', round: 20 }), /20 bölüm/i);
});
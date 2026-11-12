import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';

const source = await readFile(new URL('../first-run-tour.js', import.meta.url), 'utf8');

test('tour opens the four real navigation targets and returns to predictions or home', () => {
  const { window, document } = parseHTML(`<body>
    <button data-simple-nav="predictionStatus"></button>
    <button data-simple-nav="pred"></button>
    <button data-simple-nav="menu"></button>
    <button class="tab" data-tab="general"></button>
    <button data-simple-nav="home"></button>
  </body>`);
  const visited = [];
  for (const button of document.querySelectorAll('button')) {
    button.addEventListener('click', () => visited.push(button.dataset.simpleNav || button.dataset.tab));
  }
  vm.runInNewContext(source, { window, document });
  const tour = window.BizimSkorFirstRunTour;
  const panel = () => document.getElementById('mobileFirstRunTour');
  tour.start();
  tour.start();
  for (const title of ['Tahmin Durumum', 'Tahmin Yap', 'Menü', 'Genel Sıralama']) {
    assert.equal(panel().querySelector('h2').textContent, title);
    panel().querySelectorAll('button')[1].click();
  }
  assert.equal(panel(), null);
  tour.start();
  panel().querySelector('button').click();
  assert.equal(panel(), null);
  assert.deepEqual(visited, ['predictionStatus', 'pred', 'menu', 'general', 'pred', 'predictionStatus', 'home']);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const ui=fs.readFileSync(require.resolve('../opportunity-match-ui.js'),'utf8');
const loader=fs.readFileSync(require.resolve('../ui-integration-loader.js'),'utf8');

test('ana sayfa fırsat maçı ilan kartı artık üretilmez',()=>{
  assert.doesNotMatch(ui,/opportunityMatchCard/);
  assert.doesNotMatch(ui,/mountHomeCard/);
  assert.doesNotMatch(loader,/opportunity-card-utils\.js/);
});

test('fırsat maçı X2 işaretleme ve puanlama mantığı korunur',()=>{
  assert.match(ui,/opp-badge/);
  assert.match(ui,/markRows/);
  assert.match(ui,/patchScoring/);
  assert.match(loader,/opportunity-match-utils\.js/);
  assert.match(loader,/opportunity-match-ui\.js/);
});

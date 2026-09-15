const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const utils=fs.readFileSync(require.resolve('../opportunity-match-utils.js'),'utf8');
const ui=fs.readFileSync(require.resolve('../opportunity-match-ui.js'),'utf8');
const card=fs.readFileSync(require.resolve('../opportunity-card-utils.js'),'utf8');
const loader=fs.readFileSync(require.resolve('../ui-integration-loader.js'),'utf8');

test('7. hafta fırsat maçı Samsunspor - Trabzonspor olarak tanımlıdır',()=>{
  assert.match(utils,/\{id:58,week:7\}/);
  assert.match(ui,/\['Samsunspor','Trabzonspor'\]/);
  assert.match(card,/super:58/);
  assert.match(card,/Süper Lig 7\. Hafta/);
});

test('fırsat maçları menü entegrasyonu yüklenir',()=>{
  assert.match(loader,/opportunity-menu\.js/);
  const menu=fs.readFileSync(require.resolve('../opportunity-menu.js'),'utf8');
  assert.match(menu,/Fırsat Maçları/);
  assert.match(menu,/super:58/);
});

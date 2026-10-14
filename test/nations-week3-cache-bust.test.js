const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('Uluslar Ligi aktif tahmin kartları tüm UI yükleme zincirinin önbelleğini yeniler',()=>{
  const theme=read('theme-ui.js');
  const version=theme.match(/UI_INTEGRATION_VERSION='([^']+)'/)?.[1];
  assert.ok(version,'tema entegrasyon sürümü tanımlı olmalı');
  assert.match(read('index.html'),new RegExp(`theme-ui\\.js\\?v=${version}`));
  assert.match(theme,new RegExp(`ui-integration-loader\\.js\\?v=\\$\\{UI_INTEGRATION_VERSION\\}`));
  assert.match(require('../ui-integration-loader.js').ASSET_VERSION,/cup-bracket-v1/);
});

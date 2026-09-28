const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const version='20260928-nations-week3-v1';

test('Uluslar Ligi 3. hafta yayını tüm UI yükleme zincirinin önbelleğini yeniler',()=>{
  assert.match(read('index.html'),new RegExp(`theme-ui\\.js\\?v=${version}`));
  assert.match(read('theme-ui.js'),new RegExp(`UI_INTEGRATION_VERSION='${version}'`));
  assert.equal(require('../ui-integration-loader.js').ASSET_VERSION,version);
});

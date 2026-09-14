const assert=require('assert');
const theme=require('./theme-ui.js');

assert.strictEqual(theme.normalizeTheme('dark'),'dark');
assert.strictEqual(theme.normalizeTheme('light'),'light');
assert.strictEqual(theme.normalizeTheme('unexpected'),'light');

const lightMarkup=theme.toggleMarkup('light');
assert.ok(lightMarkup.includes('Açık'));
assert.ok(lightMarkup.includes('Koyu'));
assert.ok(lightMarkup.includes('aria-pressed="false"'));
assert.ok(theme.toggleMarkup('dark').includes('aria-pressed="true"'));

const meta={content:''};
const doc={
  documentElement:{dataset:{}},
  querySelector:selector=>selector==='meta[name="theme-color"]'?meta:null
};
theme.applyTheme('dark',doc);
assert.strictEqual(doc.documentElement.dataset.theme,'dark');
assert.strictEqual(meta.content,'#020617');
theme.applyTheme('light',doc);
assert.strictEqual(doc.documentElement.dataset.theme,'light');
assert.strictEqual(meta.content,'#071633');

const saved={};
const storage={
  getItem:key=>saved[key]||null,
  setItem:(key,value)=>{saved[key]=value}
};
assert.strictEqual(theme.changeTheme('light',storage,doc),'dark');
assert.strictEqual(saved.bizimSkorTheme,'dark');
assert.strictEqual(doc.documentElement.dataset.theme,'dark');
assert.strictEqual(theme.changeTheme('dark',storage,doc),'light');

const failingStorage={getItem(){throw new Error('blocked')}};
assert.strictEqual(theme.readTheme(failingStorage),'light');

console.log('theme-ui ok');

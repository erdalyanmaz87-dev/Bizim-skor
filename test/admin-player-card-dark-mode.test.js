const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const css=fs.readFileSync(path.join(__dirname,'../theme.css'),'utf8');

test('koyu temada yönetici oyuncu kartı okunaklı yüksek kontrast kullanır',()=>{
  assert.match(css,/html\[data-theme="dark"\] \.bs-admin-player-card\{[^}]*background:#111827!important;[^}]*color:#f8fafc!important;/);
  assert.match(css,/html\[data-theme="dark"\] \.bs-admin-player-prediction\{[^}]*background:#172033!important;[^}]*color:#f8fafc!important;/);
  assert.match(css,/html\[data-theme="dark"\] \.bs-admin-player-grid>div\{[^}]*background:#f8fafc!important;[^}]*color:#0f172a!important;/);
  assert.match(css,/html\[data-theme="dark"\] \.bs-admin-player-grid span,[\s\S]*\.bs-admin-player-grid small\{[^}]*color:#475569!important;/);
  assert.match(css,/html\[data-theme="dark"\] \.bs-admin-player-grid b\{[^}]*color:#0f172a!important;/);
  assert.match(css,/html\[data-theme="dark"\] \.bs-admin-player-backdrop\{[^}]*background:rgba\(2,6,23,\.55\)!important;/);
});

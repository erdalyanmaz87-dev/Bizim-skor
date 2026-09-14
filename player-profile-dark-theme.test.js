const test=require('node:test');
const assert=require('node:assert/strict');
const profile=require('./player-profile.js');

test('oyuncu profili koyu temada kartları ve metinleri okunaklı yapar',()=>{
  const styles=profile.darkThemeCss();
  assert.match(styles,/html\[data-theme="dark"\] \.bs-profile-card\{[^}]*background:#111827[^}]*color:#f8fafc/);
  assert.match(styles,/html\[data-theme="dark"\] \.bs-profile-stats>div\{[^}]*background:#1e293b/);
  assert.match(styles,/html\[data-theme="dark"\] \.bs-profile-stats b/);
  assert.match(styles,/html\[data-theme="dark"\] \.bs-profile-form\{[^}]*background:#172554[^}]*color:#f8fafc/);
  assert.match(styles,/html\[data-theme="dark"\] \.bs-profile-match p/);
});

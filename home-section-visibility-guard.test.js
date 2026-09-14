const assert=require('assert');
const fs=require('fs');
const source=fs.readFileSync(require.resolve('./section-visibility-guard.js'),'utf8');

assert.match(source,/function openHome\(\)\{[^}]*hideAllPredictionScreens\(\)[^}]*hideRankings\(\)[^}]*show\('home'\)/s,'Ana Sayfa açılırken tüm tahmin ekranları ve kupa sıralamaları kapatılmalı');
assert.match(source,/if\(tab==='home'\)\{openHome\(\);return\}/,'Ana Sayfa sekmesi görünürlük korumasından geçmeli');

console.log('home section visibility guard ok');

const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('supported-team-ranking-logos.js','utf8');
assert(!src.includes('new MutationObserver'),'takım logoları tüm sayfayı MutationObserver ile izlememeli');
assert(src.includes('document.addEventListener')||src.includes('doc.addEventListener'),'sıralama açılışları olay bazlı izlenmeli');
assert(src.includes('tablePlayerCells'),'Oyuncu/Katılımcı sütunları otomatik bulunmalı');
assert(src.includes('logoMarkup'),'logo renderı supported-team-ui bağımlılığı olmadan yapılmalı');
assert(src.includes('get_supported_team_context'),'takım verisi tek bağlam sorgusundan alınmalı');
console.log('supported team ranking performance contract ok');

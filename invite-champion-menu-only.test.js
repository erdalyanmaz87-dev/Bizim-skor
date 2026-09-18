const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('invite-growth-ui-bootstrap.js','utf8');
assert(src.includes("getElementById('bsSimpleInviteChampion')"),'davet şampiyonu menü feature alanına mount edilmeli');
assert(!src.includes("getElementById('knownPlayer')||doc.getElementById('home')"),'davet şampiyonu ana sayfaya mount edilmemeli');
assert(!src.includes("insertAdjacentElement('afterend',shell)"),'shell ana sayfa elemanının arkasına eklenmemeli');
console.log('invite champion menu-only contract ok');

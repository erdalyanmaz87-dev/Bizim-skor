const fs=require('fs');
const assert=require('assert');
const bootstrap=fs.readFileSync('supported-team-bootstrap.js','utf8');
const logos=fs.readFileSync('supported-team-ranking-logos.js','utf8');

const brandAt=bootstrap.indexOf("'brand-assets.js'");
const teamUiAt=bootstrap.indexOf("'supported-team-ui.js'");
assert(brandAt>=0 && teamUiAt>brandAt,'brand-assets.js takım UI dosyasından önce yüklenmeli');
assert(logos.includes('tablePlayerCells'),'tüm sıralama tabloları başlığa göre taranmalı');
assert(logos.includes("'oyuncu'") && logos.includes("'katilimci'"),'Oyuncu/Katılımcı sütunları tanınmalı');
assert(logos.includes("[data-player-name]"),'işaretli oyuncu adları doğrudan desteklenmeli');
assert(logos.includes(".league-player"),'Arena oyuncu adları desteklenmeli');
assert(logos.includes(".bs-museum-head h2"),'Müze oyuncu adı desteklenmeli');
assert(logos.includes('get_supported_team_context'),'takım eşleşmesi kayıtlı oyuncu bağlamından alınmalı');
console.log('supported team everywhere contract ok');

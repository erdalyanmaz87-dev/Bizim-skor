const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('admin-inactive-21d.js','utf8');
assert(src.includes('3 Haftadır Oyuna Girmeyenler'));
assert(src.includes('Aktif Oyuncu'));
assert(src.includes('inactive_21d'));
assert(src.includes('get_admin_statistics_dashboard'));
assert(!src.includes('MutationObserver'));
console.log('admin inactive 21d contract ok');

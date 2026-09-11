const fs=require('fs');
const assert=require('assert');
const source=fs.readFileSync('admin-statistics-dashboard.js','utf8');
assert(source.includes('get_admin_statistics_dashboard'));
assert(source.includes('Yonetici Istatistikleri')||source.includes('Yönetici İstatistikleri'));
assert(source.includes('Bugun Gelen')||source.includes('Bugün Gelen'));
assert(source.includes('Tahmin Yapmayan'));
assert(source.includes('Hatirlatma')||source.includes('Hatırlatma'));
console.log('admin dashboard contract: ok');

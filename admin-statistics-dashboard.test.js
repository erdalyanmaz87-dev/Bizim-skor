const fs=require('fs');
const assert=require('assert');
const source=fs.readFileSync('admin-statistics-dashboard.js','utf8');
assert(source.includes('get_admin_statistics_dashboard'));
assert(source.includes('Yonetici Istatistikleri')||source.includes('Yönetici İstatistikleri'));
assert(source.includes('Bugun Gelen')||source.includes('Bugün Gelen'));
assert(source.includes('Tahmin Yapmayan'));
assert(source.includes('Hatirlatma')||source.includes('Hatırlatma')||source.includes('Uyarısı'));
assert(source.includes('api.autoMount()'));
assert(source.includes("openDetail?.('adminStatistics'"));
assert(source.includes("detailId==='adminStatistics'"));
assert(source.includes('back?.()'));
const sample={
 summary:{total_players:4,active_today:3},
 players:[
  {player_name:'Ayşe',completed:true,today_launch_count:1,today_first:'2026-09-13T08:00:00Z',today_last:'2026-09-13T08:15:00Z'},
  {player_name:'Burak',completed:false,today_launch_count:2,today_first:'2026-09-13T09:00:00Z',today_last:'2026-09-13T09:20:00Z'},
  {player_name:'Cem',completed:true,today_launch_count:1,today_first:'2026-09-13T10:00:00Z',today_last:'2026-09-13T10:05:00Z'},
  {player_name:'Deniz',completed:true,today_launch_count:1},
  {player_name:'Ece',completed:true,today_launch_count:1},
  {player_name:'Fatih',completed:true,today_launch_count:1},
  {player_name:'Gül',completed:true,today_launch_count:1}
 ]
};
const dashboard=require('./admin-statistics-dashboard.js');
const html=dashboard.render(sample);
assert(html.indexOf('Oyuna Girenler')<html.indexOf('Güncel Hafta Tahmin Yapanlar'),'oyuna girenler ilk isim listesi olmalı');
assert(html.includes('bs-admin-stats-list compact'),'isim listeleri kompakt olmalı');
assert(html.includes('data-admin-stats-toggle'),'uzun listelerde tümünü göster düğmesi olmalı');
assert(source.includes('bs-admin-stats-columns'),'isimler çok sütunlu görünmeli');
assert(source.includes('Tümünü Göster')&&source.includes('Daralt'),'liste açılıp daraltılabilmeli');
console.log('admin dashboard contract: ok');

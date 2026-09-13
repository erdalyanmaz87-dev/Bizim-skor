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
assert(/detailId\s*===\s*'adminStatistics'/.test(source));
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
assert(html.includes('data-admin-player="Ayşe"'),'oyuncu isimleri tıklanabilir olmalı');
assert(/doc\.addEventListener\(\s*'click'[\s\S]*?\[data-admin-player\]/.test(source),'oyuncu kartı dokunması navigasyon katmanından bağımsız olarak belge düzeyinde dinlenmeli');
const card=dashboard.renderPlayerCard({
 name:'Ayşe',
 prediction:{saved:9,total:9,completed:true},
 superWeek:{rank:2,points:18},
 superGeneral:{rank:5,points:61},
 arena:{league:'Altın Lig',rank:3,points:72.5},
 champions:{rank:4,points:38},
 nations:{rank:null,points:null}
});
assert(card.includes('Ayşe'));
assert(card.includes('Güncel Hafta')&&card.includes('9/9'));
assert(card.includes('Süper Lig Haftalık')&&card.includes('2.')&&card.includes('18 puan'));
assert(card.includes('Süper Lig Genel')&&card.includes('5.')&&card.includes('61 puan'));
assert(card.includes('Altın Lig')&&card.includes('Arena')&&card.includes('72.50 puan'));
assert(card.includes('Şampiyonlar Ligi Genel')&&card.includes('38 puan'));
assert(card.includes('Uluslar Ligi Genel')&&card.includes('Katılmadı'));
assert(source.includes('get_player_public_profile_v2'));
assert(source.includes('get_arena_player_card'));
assert(source.includes('get_champions_league_ranking'));
assert(source.includes('get_nations_league_ranking'));
console.log('admin dashboard contract: ok');

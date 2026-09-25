const test=require('node:test');
const assert=require('node:assert/strict');

const card=require('./arena-player-card.js');

test('Arena kartı tüm organizasyon haftalarını puan ve sıralama bilgisiyle gösterir',()=>{
  const html=card.renderPlayerCard({
    player_name:'Erdal',
    league_code:'gold',
    rounds:[
      {competition:'super_lig',round_key:'2026/27:5',rank:3,participant_count:65,performance_score:96.88},
      {competition:'super_lig',round_key:'2026/27:6',rank:22,participant_count:63,performance_score:66.13},
      {competition:'nations_league',round_key:'2026/27:1',rank:4,participant_count:56,performance_score:94.55},
      {competition:'champions_league',round_key:'2026/27:2',rank:8,participant_count:60,performance_score:88.14}
    ]
  });

  assert.match(html,/Uluslar Ligi 1\. Hafta/);
  assert.match(html,/Şampiyonlar Ligi 2\. Hafta/);
  assert.match(html,/4\. sıra \/ 56 oyuncu/);
  assert.match(html,/94\.55/);
});

test('kart açıklaması kupa haftalarının ortalamaya katıldığını fakat geçerli turu artırmadığını açıklar',()=>{
  const html=card.renderPlayerCard({rounds:[]});
  assert.match(html,/Süper Lig, Şampiyonlar Ligi ve Uluslar Ligi/i);
  assert.match(html,/Geçerli tur yalnız Süper Lig haftalarından oluşur/i);
});

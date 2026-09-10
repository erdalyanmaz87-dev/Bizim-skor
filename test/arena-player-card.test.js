const test=require('node:test');
const assert=require('node:assert/strict');
const Card=require('../arena-player-card');

test('Arena oyuncu kartı canlı dönem özetini ve tur detaylarını gösterir',()=>{
  const html=Card.renderPlayerCard({
    player_name:'Erdal',league_code:'gold',league_rank:2,league_size:12,
    performance_score:85,valid_round_count:4,is_eligible:true,promotion_status:'promotion',
    rounds:[
      {competition:'super_lig',round_key:'2026/27:5',performance_score:90,rank:2,participant_count:21},
      {competition:'champions_league',round_key:'2026/27:1',performance_score:80,rank:5,participant_count:30}
    ]
  });
  assert.match(html,/Erdal/);
  assert.match(html,/Altın Lig/);
  assert.match(html,/2 \/ 12/);
  assert.match(html,/85\.00/);
  assert.match(html,/Yükselme hattında/);
  assert.match(html,/Süper Lig 5\. Hafta/);
  assert.match(html,/Şampiyonlar Ligi 1\. Tur/);
  assert.match(html,/90\.00/);
  assert.match(html,/80\.00/);
});

test('iki tur şartını tamamlamayan oyuncu uyarılır',()=>{
  const html=Card.renderPlayerCard({player_name:'Ali',league_code:'silver',league_rank:8,league_size:15,performance_score:55,valid_round_count:1,is_eligible:false,promotion_status:'none',rounds_needed:1,rounds:[]});
  assert.match(html,/1 tur daha gerekli/);
  assert.match(html,/Gümüş Lig/);
});

test('geçici Arena kartı 3 ve 4. hafta başlangıç puanını açıklar',()=>{
  const html=Card.renderPreviewCard({player_name:'Ayşe',league_code:'bronze',league_rank:5,league_size:18,performance_score:62.5});
  assert.match(html,/Geçici başlangıç/);
  assert.match(html,/3\. ve 4\. hafta/);
  assert.match(html,/62\.50/);
});

test('oyuncu adı html olarak çalıştırılmaz',()=>{
  const html=Card.renderPlayerCard({player_name:'<img src=x onerror=alert(1)>',league_code:'bronze',rounds:[]});
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/&lt;img/);
});

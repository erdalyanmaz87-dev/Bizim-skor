const test=require('node:test');
const assert=require('node:assert/strict');
const Card=require('../arena-player-card');

test('Arena oyuncu kartı canlı dönem özetini ve tur detaylarını gösterir',()=>{
  const html=Card.renderPlayerCard({
    player_name:'Erdal',league_code:'gold',league_rank:2,league_size:12,
    performance_score:90,valid_round_count:1,is_eligible:false,promotion_status:'none',
    rounds:[
      {competition:'super_lig',round_key:'2026/27:5',performance_score:90,rank:2,participant_count:21}
    ]
  });
  assert.match(html,/Erdal/);
  assert.match(html,/Altın Lig/);
  assert.match(html,/2 \/ 12/);
  assert.match(html,/Ortalama Arena Puanı/);
  assert.match(html,/5\. Hafta/);
  assert.match(html,/90\.00/);
  assert.match(html,/1 \/ 2/);
});

test('canlı dönem kartı 5-8 hafta kutularını ortalama puanı ve tek katılım kutusunu gösterir',()=>{
  const html=Card.renderPlayerCard({
    player_name:'Erdal',league_code:'gold',league_rank:3,league_size:12,
    performance_score:75,valid_round_count:1,is_eligible:false,rounds_needed:1,
    rounds:[{competition:'super_lig',round_key:'2026\/27:5',performance_score:75,rank:4,participant_count:60}]
  });
  assert.match(html,/Ortalama Arena Puanı/);
  assert.match(html,/5\. Hafta/);
  assert.match(html,/75\.00/);
  assert.match(html,/6\. Hafta[\s\S]*—/);
  assert.match(html,/7\. Hafta[\s\S]*—/);
  assert.match(html,/8\. Hafta[\s\S]*—/);
  assert.match(html,/Katılım Durumu[\s\S]*1 \/ 2/);
  assert.doesNotMatch(html,/3\. Hafta|4\. Hafta|Geçerli tur/);
});

test('iki tur şartını tamamlamayan oyuncu uyarılır',()=>{
  const html=Card.renderPlayerCard({player_name:'Ali',league_code:'silver',league_rank:8,league_size:15,performance_score:55,valid_round_count:1,is_eligible:false,promotion_status:'none',rounds_needed:1,rounds:[]});
  assert.match(html,/1 tur daha gerekli/);
  assert.match(html,/Gümüş Lig/);
});

test('geçici Arena kartı 3 ve 4. hafta puanlarını, ortalamayı ve katılımı gösterir',()=>{
  const html=Card.renderPreviewCard({player_name:'Ayşe',league_code:'bronze',league_rank:5,league_size:18,performance_score:62.5,week3_score:75,week4_score:50,valid_round_count:2,rounds_needed:0});
  assert.match(html,/Geçici başlangıç/);
  assert.match(html,/3\. Hafta/);
  assert.match(html,/75\.00/);
  assert.match(html,/4\. Hafta/);
  assert.match(html,/50\.00/);
  assert.match(html,/Başlangıç ortalaması/);
  assert.match(html,/62\.50/);
  assert.match(html,/2 \/ 2/);
  assert.match(html,/2 başlangıç haftası tamamlandı/);
});

test('geçici Arena kartı eksik başlangıç haftasını sıfır ve uyarı ile gösterir',()=>{
  const html=Card.renderPreviewCard({player_name:'Ali',league_code:'silver',league_rank:8,league_size:15,performance_score:35,week3_score:70,week4_score:0,valid_round_count:1,rounds_needed:1});
  assert.match(html,/70\.00/);
  assert.match(html,/0\.00/);
  assert.match(html,/1 \/ 2/);
  assert.match(html,/1 başlangıç haftası eksik/);
});

test('oyuncu adı html olarak çalıştırılmaz',()=>{
  const html=Card.renderPlayerCard({player_name:'<img src=x onerror=alert(1)>',league_code:'bronze',rounds:[]});
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/&lt;img/);
});

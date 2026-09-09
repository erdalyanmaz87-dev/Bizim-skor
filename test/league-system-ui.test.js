const test=require('node:test');
const assert=require('node:assert/strict');
const UI=require('../league-system-ui');

test('uygun olmayan oyuncuya bir tur daha mesajı gösterir',()=>{
  const html=UI.renderLeagueSummary({is_eligible:false,valid_round_count:1,rounds_needed:1,league_code:'bronze'});
  assert.match(html,/Lig sistemine katılmak için 1 tahmin turu daha tamamla/);
  assert.match(html,/bir alt lige düşersin/);
});

test('kullanıcının ligi için yükselme ve düşme sınıflarını üretir',()=>{
  const rows=[
    {league_rank:1,player_name:'A',performance_score:92,valid_round_count:4,exact_score_count:8,promotion_status:'promotion',is_me:false},
    {league_rank:4,player_name:'Erdal',performance_score:80,valid_round_count:4,exact_score_count:5,promotion_status:'none',is_me:true},
    {league_rank:13,player_name:'B',performance_score:40,valid_round_count:2,exact_score_count:1,promotion_status:'relegation',is_me:false}
  ];
  const html=UI.renderLeagueTable(rows,{league_code:'gold'});
  assert.match(html,/league-promotion-zone/);
  assert.match(html,/league-relegation-zone/);
  assert.match(html,/league-me/);
});

test('kurallar 4 hafta, 2 tur ve pasiflik düşüşünü açıklar',()=>{
  const html=UI.renderLeagueRules();
  assert.match(html,/4 hafta/);
  assert.match(html,/en az 2 ayrı tahmin turu/);
  assert.match(html,/bir alt lige düşer/);
  assert.match(html,/Bronz Lig oyuncusu Bronz Lig’de kalır/);
});

test('diğer ligleri kompakt seçenekler olarak gösterir',()=>{
  const html=UI.renderOtherLeagueChips({champions:6,elite:9,gold:13,silver:16,bronze:19},'gold');
  assert.match(html,/Şampiyonlar/);
  assert.match(html,/Elit/);
  assert.match(html,/Altın/);
  assert.match(html,/Gümüş/);
  assert.match(html,/Bronz/);
  assert.match(html,/league-chip-active/);
});

test('oyuncu adını html olarak çalıştırmaz',()=>{
  const html=UI.renderLeagueTable([{league_rank:1,player_name:'<img src=x onerror=alert(1)>',performance_score:100,valid_round_count:2,exact_score_count:2,promotion_status:'promotion',is_me:false}],{league_code:'bronze'});
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/&lt;img/);
});

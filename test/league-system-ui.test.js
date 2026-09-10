const test=require('node:test');
const assert=require('node:assert/strict');
const UI=require('../league-system-ui');

test('uygun olmayan oyuncunun ligi sırası puanı görünür ve iki tur uyarısı gösterilir',()=>{
  const html=UI.renderLeagueSummary({is_eligible:false,valid_round_count:0,rounds_needed:2,league_code:'gold',rank_in_league:7,league_size:15,performance_score:42.86});
  assert.match(html,/Altın Lig/);
  assert.match(html,/7 \/ 15/);
  assert.match(html,/42\.86/);
  assert.match(html,/Yükselme\/düşme için 2 tahmin turu daha tamamla/);
});

test('iki tur uyarısı yalnız oyuncunun kendi liginde görünür',()=>{
  const own=UI.renderLeagueShell({is_eligible:false,rounds_needed:2,league_code:'gold',own_league_code:'gold'},[],{});
  const other=UI.renderLeagueShell({is_eligible:false,rounds_needed:2,league_code:'silver',own_league_code:'gold'},[],{});
  assert.match(own,/league-eligibility-note/);
  assert.doesNotMatch(other,/league-eligibility-note/);
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

test('kurallar 4 Süper Lig haftası, 2 tur ve pasiflik düşüşünü açıklar',()=>{
  const html=UI.renderLeagueRules();
  assert.match(html,/4 Süper Lig haftası/);
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

test('Arena dönemi henüz açılmadıysa yükleniyor yerine hazırlık durumu gösterilir',()=>{
  const html=UI.renderArenaPending();
  assert.match(html,/Arena dönemi hazırlanıyor/);
  assert.match(html,/5\. hafta/);
  assert.doesNotMatch(html,/yükleniyor/i);
});

test('özet RPC veri döndürmezse Arena ekranında hazırlık durumu bırakılır',async()=>{
  const detailHost={innerHTML:''};
  const summaryHost={innerHTML:''};
  const sb={rpc:async(name)=>name==='get_my_league_summary'?{data:null,error:null}:{data:[],error:null}};
  const mounted=await UI.mount({sb,token:'test-token',summaryHost,detailHost});
  assert.equal(mounted,true);
  assert.match(detailHost.innerHTML,/Arena dönemi hazırlanıyor/);
});

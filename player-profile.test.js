const test=require('node:test');
const assert=require('node:assert/strict');

test('profil modülü herkese açık geçmiş modelini üretir',()=>{
  const profile=require('./player-profile.js');
  const model=profile.buildModel([
    {player_name:'İpek',week:4,week_rank:3,week_points:12,general_rank:9,sezu_rank:2,champions_rank:6,special_kind:'sezu',fixture_id:30,home_team:'A',away_team:'B',kickoff:'2026-09-07T17:00:00Z',predicted_home:2,predicted_away:1,real_home:2,real_away:1,match_points:8},
    {player_name:'İpek',week:4,week_rank:3,week_points:12,general_rank:9,sezu_rank:2,champions_rank:6,special_kind:'sezu',fixture_id:31,home_team:'C',away_team:'D',kickoff:'2026-09-08T17:00:00Z',predicted_home:null,predicted_away:null,real_home:null,real_away:null,match_points:0}
  ]);
  assert.equal(model.name,'İpek');
  assert.equal(model.kind,'super');
  assert.equal(model.specialLabel,'Sezu Sıralaması');
  assert.equal(model.matches[0].symbol,'🎯');
  assert.equal(model.matches[1].prediction,'*-*');
});

test('yalnız doğru sonuçta top işareti gösterilir',()=>{
  const profile=require('./player-profile.js');
  assert.equal(profile.matchSymbol({predicted_home:1,predicted_away:0,real_home:3,real_away:1}),'⚽');
  assert.equal(profile.matchSymbol({predicted_home:1,predicted_away:0,real_home:0,real_away:1}),'');
});

test('sıralama hücresini erişilebilir oyuncu düğmesine çevirir',()=>{
  const profile=require('./player-profile.js');
  const html=profile.playerButton('İpek & Ada');
  assert.match(html,/class="bs-player-profile-link"/);
  assert.match(html,/data-player-name="İpek &amp; Ada"/);
  assert.match(html,/>İpek &amp; Ada<\/button>/);
});

test('haftalık sıralamadaki oyuncu bağlantısı seçili haftayı taşır',()=>{
  const profile=require('./player-profile.js');
  const html=profile.playerButton('İpek',2);
  assert.match(html,/data-profile-week="2"/);
});

test('şampiyonlar ligi sıralamasındaki oyuncu bağlantısı lig bağlamını taşır',()=>{
  const profile=require('./player-profile.js');
  const html=profile.playerButton('İpek',1,'champions');
  assert.match(html,/data-profile-week="1"/);
  assert.match(html,/data-profile-kind="champions"/);
});

test('profil sorgusu haftalık bağlamda haftayı gönderir, genel bağlamda göndermez',()=>{
  const profile=require('./player-profile.js');
  assert.deepEqual(profile.profileRpcArgs('token','İpek',2),{p_token:'token',p_player_name:'İpek',p_week:2});
  assert.deepEqual(profile.profileRpcArgs('token','İpek'),{p_token:'token',p_player_name:'İpek'});
});

test('şampiyonlar ligi oyuncu profili ayrı RPC ile güncel haftayı ister',()=>{
  const profile=require('./player-profile.js');
  assert.deepEqual(profile.profileRequest('token','İpek',1,'champions'),{
    rpc:'get_champions_league_player_profile',
    args:{p_token:'token',p_player_name:'İpek',p_season:'2026/27',p_week:1}
  });
});

test('şampiyonlar ligi hafta profili maç ve genel sıralama modelini üretir',()=>{
  const profile=require('./player-profile.js');
  const model=profile.buildModel([{player_name:'İpek',week:1,week_rank:4,week_points:7,week_exact:1,week_correct:3,general_rank:null,sezu_rank:null,champions_rank:5,special_kind:'champions_week',participant_count:45,fixture_id:101,home_team:'Real Madrid',away_team:'Inter',predicted_home:2,predicted_away:1,real_home:null,real_away:null,match_points:0}]);
  assert.equal(model.kind,'champions');
  assert.equal(model.weekLabel,'Şampiyonlar Ligi 1. Hafta Sıralaması');
  assert.equal(model.specialLabel,'Şampiyonlar Ligi Genel Sıralaması');
  assert.equal(model.specialRank,5);
  assert.equal(model.participantCount,45);
});

test('şampiyonlar ligi dönemi özel kart etiketini değiştirir',()=>{
  const profile=require('./player-profile.js');
  const model=profile.buildModel([{player_name:'İpek',week:5,week_rank:1,week_points:4,general_rank:7,sezu_rank:2,champions_rank:3,special_kind:'champions'}]);
  assert.equal(model.specialLabel,'Şampiyonlar Ligi Sıralaması');
  assert.equal(model.specialRank,3);
});

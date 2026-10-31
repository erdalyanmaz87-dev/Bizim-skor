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

test('robotla seçilen tahminin yanında robot işareti görünür',()=>{
  const profile=require('./player-profile.js');
  const model=profile.buildModel([
    {player_name:'Hakan',week:6,fixture_id:46,home_team:'Kasımpaşa',away_team:'Konyaspor',predicted_home:2,predicted_away:0,real_home:null,real_away:null,robot_applied:true}
  ]);
  assert.equal(model.matches[0].prediction,'2-0 🤖');
  assert.match(profile.profileMarkup(model),/2-0 🤖/);
});

test('yalnız doğru sonuçta onay işareti gösterilir',()=>{
  const profile=require('./player-profile.js');
  assert.equal(profile.matchSymbol({predicted_home:1,predicted_away:0,real_home:3,real_away:1}),'✅');
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

test('şampiyonlar ligi oyuncu profili ayrı v2 RPC ile güncel haftayı ister',()=>{
  const profile=require('./player-profile.js');
  assert.deepEqual(profile.profileRequest('token','İpek',1,'champions'),{
    rpc:'get_champions_league_player_profile_v2',
    args:{p_token:'token',p_player_name:'İpek',p_season:'2026/27',p_week:1}
  });
});

test('süper lig oyuncu profili v2 RPC ile robot bilgisini taşıyabilir',()=>{
  const profile=require('./player-profile.js');
  assert.deepEqual(profile.profileRequest('token','İpek',6,'super'),{
    rpc:'get_player_public_profile_v2',
    args:{p_token:'token',p_player_name:'İpek',p_week:6}
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

test('arena kartı lig adı sıra ve puanı gösterir',()=>{
  const profile=require('./player-profile.js');
  const arena=profile.buildArenaModel({league_code:'gold',league_rank:2,performance_score:84.5});
  assert.deepEqual(arena,{leagueCode:'gold',leagueLabel:'Arena Altın Ligi',rank:2,score:84.5});
  assert.match(profile.arenaMarkup(arena),/Arena Altın Ligi • 2\./);
  assert.match(profile.arenaMarkup(arena),/Puan: 84,50/);
});


test('profil puan türlerini ve iki kat fırsat puanlarını doğru sembolle gösterir',()=>{
  const profile=require('./player-profile.js');
  for(const kind of ['super','champions','nations']){
    for(const multiplier of [1,2]){
      const cases=[[2,1,10,'🎯'],[3,2,6,'🥅'],[3,0,4,'🔢'],[4,0,2,'✅'],[0,1,0,'']];
      const rows=cases.map(([h,a,points],i)=>({player_name:'Test',week:10,week_correct:4,week_exact:1,special_kind:kind==='super'?'champions':kind+'_week',fixture_id:200+i,scoring_version:2,predicted_home:h,predicted_away:a,real_home:2,real_away:1,match_points:points*multiplier}));
      const model=profile.buildModel(rows),html=profile.profileMarkup(model);
      assert.deepEqual(model.matches.map(r=>r.symbol),cases.map(c=>c[3]));
      for(const [, ,points,symbol] of cases.filter(c=>c[2]))assert.ok(html.includes(`${symbol} +${points*multiplier}`));
      assert.ok(html.includes('1 🎯 • 1 🥅 • 1 🔢 • 1 ✅'));
      assert.ok(!html.includes('⚽'));
      assert.equal(model.weekCorrect,4);
    }
  }
});

test('profil gerçek ekran örneğini ve gizli skorları korur',()=>{
 const profile=require('./player-profile.js');
 const rows=[
  {fixture_id:128,predicted_home:1,predicted_away:3,real_home:0,real_away:4,match_points:4},
  {fixture_id:129,predicted_home:2,predicted_away:3,real_home:1,real_away:3,match_points:2},
  {fixture_id:130,predicted_home:1,predicted_away:2,real_home:1,real_away:2,match_points:10},
  {fixture_id:131,predicted_home:null,predicted_away:null,real_home:null,real_away:null,match_points:0}
 ];
 const model=profile.buildModel(rows);
 assert.deepEqual(model.matches.map(r=>r.symbol),['🔢','✅','🎯','']);
 assert.equal(model.matches[3].prediction,'*-*');
});

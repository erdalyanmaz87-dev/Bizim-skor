const test=require('node:test');
const assert=require('node:assert/strict');
const Live=require('../live-score-ui');

test('canlı ve bitmiş sağlayıcı durumlarını ayırır',()=>{
  assert.equal(Live.isLiveStatus('2H'),true);
  assert.equal(Live.isLiveStatus('FT'),false);
  assert.equal(Live.isTerminalStatus('FT'),true);
  assert.equal(Live.isTerminalStatus('PST'),false);
});

test('yalnız skor yükseldiğinde gol geçişi üretir',()=>{
  assert.equal(Live.detectGoal({home_score:1,away_score:1},{home_score:2,away_score:1}),true);
  assert.equal(Live.detectGoal({home_score:2,away_score:1},{home_score:2,away_score:1}),false);
  assert.equal(Live.detectGoal(null,{home_score:1,away_score:0}),false);
});

test('on dakikadan eski canlı veriyi gecikmiş sayar',()=>{
  const now=new Date('2026-08-30T17:10:01Z');
  assert.equal(Live.isStale('2026-08-30T17:00:00Z',now),true);
  assert.equal(Live.isStale('2026-08-30T17:01:00Z',now),false);
});

test('tam bilenler bandını güvenli metinle oluşturur',()=>{
  assert.equal(Live.formatExactPredictors([]),'Şu an tam skoru bilen yok.');
  assert.equal(Live.formatExactPredictors(['Erdal','YEK']),'🎯 Şu an tam bilenler: Erdal • YEK');
});

test('tam bilenler sabit alanda ilk beş isim ve kalan kişi sayısını gösterir',()=>{
  assert.equal(
    Live.formatExactPredictors(['Erdal','YEK','İpek','Mert','Emre','Fahri','Tayfun']),
    '🎯 Şu an tam bilenler: Erdal • YEK • İpek • Mert • Emre • +2 kişi'
  );
});

test('canlı maç kartında skor dakika ve bilenleri gösterir',()=>{
  const html=Live.renderLiveMatchMarkup(
    {id:23,home_team:'Eyüpspor',away_team:'Alanyaspor'},
    {status:'2H',elapsed:67,home_score:1,away_score:1,fetched_at:'2026-08-30T17:00:00Z',exact_players:['Erdal']},
    new Date('2026-08-30T17:04:00Z')
  );
  assert.match(html,/CANLI/);
  assert.match(html,/67/);
  assert.match(html,/Eyüpspor/);
  assert.match(html,/1\s*-\s*1/);
  assert.match(html,/Alanyaspor/);
  assert.match(html,/Erdal/);
});

test('takım ve oyuncu adlarında html çalıştırmaz',()=>{
  const html=Live.renderLiveMatchMarkup(
    {id:1,home_team:'<img src=x onerror=alert(1)>',away_team:'Rakip'},
    {status:'1H',elapsed:2,home_score:0,away_score:0,fetched_at:'2026-08-30T17:00:00Z',exact_players:['<script>x</script>']},
    new Date('2026-08-30T17:01:00Z')
  );
  assert.doesNotMatch(html,/<script|<img/i);
  assert.match(html,/&lt;script&gt;/);
});

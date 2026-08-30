const test=require('node:test');
const assert=require('node:assert/strict');

let selectDailyMatches=()=>({label:'',matches:[]}),renderDailyMatchesMarkup=()=>'',mergeDailyMatchesWithLiveState=()=>[];
try{
  const api=require('../daily-matches-utils');
  selectDailyMatches=api.selectDailyMatches||selectDailyMatches;
  renderDailyMatchesMarkup=api.renderDailyMatchesMarkup||renderDailyMatchesMarkup;
  mergeDailyMatchesWithLiveState=api.mergeDailyMatchesWithLiveState||mergeDailyMatchesWithLiveState;
}catch{}

const fixtures=[
  {id:1,home_team:'Konyaspor',away_team:'Kocaelispor',kickoff:'2026-08-29T16:00:00Z'},
  {id:2,home_team:'Galatasaray',away_team:'Göztepe',kickoff:'2026-08-29T18:30:00Z'},
  {id:3,home_team:'Samsunspor',away_team:'Fenerbahçe',kickoff:'2026-08-30T18:30:00Z'}
];

test('bugün oynanacak fikstürleri Türkiye saatine göre seçer',()=>{
  const result=selectDailyMatches(fixtures,new Date('2026-08-29T10:00:00Z'));
  assert.equal(result.label,'Bugünün Maçları');
  assert.deepEqual(result.matches.map(x=>({id:x.id,time:x.time})),[
    {id:1,time:'19.00'},
    {id:2,time:'21.30'}
  ]);
});

test('bugün maç yoksa en yakın maç gününü gösterir',()=>{
  const result=selectDailyMatches(fixtures,new Date('2026-08-28T10:00:00Z'));
  assert.equal(result.label,'Yarının Maçları');
  assert.deepEqual(result.matches.map(x=>x.id),[1,2]);
});

test('gelecekte maç kalmadıysa boş durum döner',()=>{
  const result=selectDailyMatches(fixtures,new Date('2026-09-01T10:00:00Z'));
  assert.equal(result.label,'Bugünün Maçları');
  assert.deepEqual(result.matches,[]);
});

test('günlük maç kartı saat ve takımları okunaklı gösterir',()=>{
  const html=renderDailyMatchesMarkup({
    label:'Bugünün Maçları',
    matches:[{time:'19.00',home_team:'Konyaspor',away_team:'Kocaelispor'}]
  },x=>x);
  assert.equal(html,'<h2>⚽ Bugünün Maçları</h2><div class="daily-match"><b>19.00</b><span>Konyaspor – Kocaelispor</span></div>');
});

test('maç kalmadığında kart boş durum mesajı gösterir',()=>{
  const html=renderDailyMatchesMarkup({label:'Bugünün Maçları',matches:[]},x=>x);
  assert.match(html,/Bugün oynanacak maç bulunmuyor/);
});

test('canlı skoru yalnız müsabaka türü ve fikstür kimliği birlikte eşleşince bağlar',()=>{
  const rows=[
    {competition:'super_lig',fixture_id:23,status:'2H',home_score:1,away_score:1},
    {competition:'champions_league',fixture_id:23,status:'1H',home_score:2,away_score:0}
  ];
  const merged=mergeDailyMatchesWithLiveState([
    {id:23,competition:'super_lig'},
    {id:23,competition:'champions_league'},
    {id:24,competition:'super_lig'}
  ],rows);
  assert.equal(merged[0].live.home_score,1);
  assert.equal(merged[1].live.home_score,2);
  assert.equal(merged[2].live,null);
});

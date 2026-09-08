const test=require('node:test');
const assert=require('node:assert/strict');

let selectDailyMatches=()=>({label:'',matches:[]}),renderDailyMatchesMarkup=()=>'',mergeDailyMatchesWithLiveState=()=>[],resolvePlayerName=async()=>'',loadMyPredictions=async()=>false,setPredictions=()=>{};
try{
  const api=require('../daily-matches-utils');
  selectDailyMatches=api.selectDailyMatches||selectDailyMatches;
  renderDailyMatchesMarkup=api.renderDailyMatchesMarkup||renderDailyMatchesMarkup;
  mergeDailyMatchesWithLiveState=api.mergeDailyMatchesWithLiveState||mergeDailyMatchesWithLiveState;
  resolvePlayerName=api.resolvePlayerName||resolvePlayerName;
  loadMyPredictions=api.loadMyPredictions||loadMyPredictions;
  setPredictions=api.__setMyPredictionsForTest||setPredictions;
}catch{}

const fixtures=[
  {id:1,home_team:'Konyaspor',away_team:'Kocaelispor',kickoff:'2026-08-29T16:00:00Z'},
  {id:2,home_team:'Galatasaray',away_team:'Göztepe',kickoff:'2026-08-29T18:30:00Z'},
  {id:3,home_team:'Samsunspor',away_team:'Fenerbahçe',kickoff:'2026-08-30T18:30:00Z'}
];

test('bugün oynanacak fikstürleri Türkiye saatine göre seçer',()=>{
  const result=selectDailyMatches(fixtures,new Date('2026-08-29T10:00:00Z'));
  assert.equal(result.label,'Günün Maçları');
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
  assert.equal(result.label,'Günün Maçları');
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

test('günün maçında kayıtlı tahmini müsabaka türüne göre gösterir',()=>{
  setPredictions([{competition:'champions_league',fixture_id:2,home_score:3,away_score:1}]);
  const result=selectDailyMatches([
    {id:2,competition:'champions_league',home_team:'Real Madrid',away_team:'Inter',kickoff:'2026-09-08T19:00:00Z'}
  ],new Date('2026-09-08T06:00:00Z'));
  assert.deepEqual(result.matches[0].my_prediction,{home:3,away:1});
  const html=renderDailyMatchesMarkup(result,x=>x);
  assert.match(html,/Sizin tahmininiz: <b>3 - 1<\/b>/);
});

test('oyuncu adını token ile canlı oturumdan çözer ve localStoragea yazar',async()=>{
  const previous=globalThis.sb;
  const previousStorage=globalThis.localStorage;
  const store=new Map([['bizimSkorFriendToken','token-1'],['bizimSkorName','Eski İsim']]);
  globalThis.localStorage={getItem:key=>store.get(key)||'',setItem:(key,value)=>store.set(key,value)};
  globalThis.sb={rpc:async(name,args)=>{
    assert.equal(name,'friend_session_player');
    assert.deepEqual(args,{p_token:'token-1'});
    return {data:'Erdal YANMAZ',error:null};
  }};
  const name=await resolvePlayerName();
  assert.equal(name,'Erdal YANMAZ');
  assert.equal(store.get('bizimSkorName'),'Erdal YANMAZ');
  globalThis.sb=previous;
  globalThis.localStorage=previousStorage;
});

test('tahminleri çekerken localStorage adı yerine tokenın çözdüğü güncel oyuncuyu kullanır',async()=>{
  const previous=globalThis.sb;
  const previousStorage=globalThis.localStorage;
  const calls=[];
  const store=new Map([['bizimSkorFriendToken','token-1'],['bizimSkorName','Yanlış İsim']]);
  globalThis.localStorage={getItem:key=>store.get(key)||'',setItem:(key,value)=>store.set(key,value)};
  const chain=table=>({
    select:()=>({eq:(field,value)=>{calls.push({table,field,value});return Promise.resolve({data:[],error:null})}})
  });
  globalThis.sb={
    rpc:async()=>({data:'Doğru Oyuncu',error:null}),
    from:chain
  };
  await loadMyPredictions();
  assert.deepEqual(calls.map(x=>x.value),['Doğru Oyuncu','Doğru Oyuncu','Doğru Oyuncu']);
  globalThis.sb=previous;
  globalThis.localStorage=previousStorage;
});

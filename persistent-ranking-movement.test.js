const test=require('node:test');
const assert=require('node:assert/strict');
const Live=require('./super-ranking-movement-live');

test('kalici hareketleri context id ile indeksler',()=>{
  const data=Live.indexRows([
    {context_id:'super:general',player_name:'Kat',before_rank:25,after_rank:21},
    {context_id:'super:weekly:5',player_name:'Kat',before_rank:26,after_rank:19},
    {context_id:'friend:abc',player_name:'Kat',before_rank:3,after_rank:2},
    {context_id:'arena:1:gold',player_name:'Kat',before_rank:4,after_rank:3}
  ]);
  assert.deepEqual(data.get('super:general').get('kat'),{beforeRank:25,afterRank:21});
  assert.equal(data.get('friend:abc').get('kat').afterRank,2);
});

test('arena basligindan lig kodunu bulur',()=>{
  assert.equal(Live.arenaCode('🥇 Altın Lig'),'gold');
  assert.equal(Live.arenaCode('💎 Elit Lig'),'elite');
  assert.equal(Live.arenaCode('👑 Şampiyonlar'),'champions');
});

test('siralama ekranlarinin contextlerini uretir',()=>{
  assert.equal(Live.contextFor('generalBoard',{week:5}),'super:general');
  assert.equal(Live.contextFor('weeklyRankingBoard',{week:5}),'super:weekly:5');
  assert.equal(Live.contextFor('championsRankingBoard',{season:'2026/27'}),'champions:2026/27:general');
  assert.equal(Live.contextFor('championsWeeklyRankingBoard',{season:'2026/27',week:2}),'champions:2026/27:weekly:2');
  assert.equal(Live.contextFor('nationsRankingBoard',{season:'2026/27'}),'nations:2026/27:general');
  assert.equal(Live.contextFor('nationsWeeklyRankingBoard',{season:'2026/27',week:1}),'nations:2026/27:weekly:1');
  assert.equal(Live.contextFor('friendLeagueRanking',{leagueId:'abc'}),'friend:abc');
});

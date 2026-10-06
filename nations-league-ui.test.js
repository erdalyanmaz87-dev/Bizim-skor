const test=require('node:test');
const assert=require('node:assert/strict');
const ui=require('./nations-league-ui.js');

test('tahmin durumunda yalnızca en yeni iki Uluslar Ligi haftası kalır',()=>{
  assert.deepEqual(ui.latestPredictionWeeks([6,3,1,5,2,4,6],2),[5,6]);
});

test('genel Uluslar Ligi profili sonuç girilmiş son haftayı açar',()=>{
  const week=ui.selectRankingContextWeek([
    {week:1,rows:[{real_home:2,real_away:0}]},
    {week:2,rows:[{real_home:null,real_away:null}]}
  ]);
  assert.equal(week,1);
  assert.match(ui.tableMarkup([{league_rank:1,player_name:'İpek',points:4,exact_count:1,correct_count:1}],week),/data-profile-week="1"/);
});

test('yeni haftada sonuç oluşunca genel profil otomatik o haftaya geçer',()=>{
  assert.equal(ui.selectRankingContextWeek([
    {week:1,rows:[{real_home:2,real_away:0}]},
    {week:2,rows:[{real_home:1,real_away:1}]}
  ]),2);
});

test('aynı Uluslar Ligi hafta isteği eşzamanlı gelirse sunucuya bir kez gider',async()=>{
  const oldStorage=global.localStorage,oldSb=global.sb;
  let calls=0,release;
  global.localStorage={getItem:key=>key==='bizimSkorFriendToken'?'token-1':null};
  global.sb={rpc:async(name,args)=>{calls++;await new Promise(resolve=>{release=resolve});return{data:[{fixture_id:301,week:3}],error:null}}};
  try{
    const first=ui.loadWeekRows(3),second=ui.loadWeekRows(3);
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(calls,1);
    release();
    assert.deepEqual(await first,await second);
  }finally{global.localStorage=oldStorage;global.sb=oldSb}
});

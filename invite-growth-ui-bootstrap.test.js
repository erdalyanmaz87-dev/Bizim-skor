const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {buildState,mount}=require('./invite-growth-ui-bootstrap');

test('buildState maps rpc rows for month and season and selects champion',()=>{
  const state=buildState({month:[{player_name:'Erdal',invite_count:3,invite_rank:1}],season:[{player_name:'Erdal',invite_count:5,invite_rank:1}]});
  assert.deepEqual(state.month,[{name:'Erdal',count:3,rank:1}]);
  assert.deepEqual(state.season,[{name:'Erdal',count:5,rank:1}]);
  assert.deepEqual(state.champion,{name:'Erdal',count:3,rank:1});
});

test('mount stays hidden without a logged-in friend session',()=>{
  const doc={getElementById:id=>id==='knownPlayer'?{}:null,createElement:()=>({}),head:{insertAdjacentHTML(){}}};
  const host={localStorage:{getItem:()=>''}};
  assert.equal(mount(doc,host),false);
});

test('bootstrap includes leaderboard and champion style markup',()=>{
  const source=fs.readFileSync(require.resolve('./invite-growth-ui-bootstrap'),'utf8');
  assert.match(source,/BizimSkorInviteLeaderboardUI\.styleMarkup\(\)/);
  assert.match(source,/BizimSkorInviteChampionUI\.styleMarkup\(\)/);
});

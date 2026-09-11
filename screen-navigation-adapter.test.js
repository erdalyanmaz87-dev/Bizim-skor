const test=require('node:test');
const assert=require('node:assert/strict');
const {detailForElement}=require('./screen-navigation-adapter.js');

test('player profile link maps to playerProfile detail',()=>{
  const el={matches:s=>s==='.bs-player-profile-link',dataset:{playerName:'Erdal',profileWeek:'5',profileKind:''}};
  assert.deepEqual(detailForElement(el),{id:'playerProfile',title:'Erdal',context:{name:'Erdal',week:5,kind:null}});
});

test('support buttons map to their detail screens',()=>{
  const player={matches:s=>s==='#openSupportInbox'};
  const admin={matches:s=>s==='#openSupportAdmin'};
  assert.deepEqual(detailForElement(player),{id:'supportPlayer',title:'Bize Ulaşın',context:null});
  assert.deepEqual(detailForElement(admin),{id:'supportAdmin',title:'Gelen Kutusu',context:null});
});

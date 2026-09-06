const test=require('node:test');
const assert=require('node:assert/strict');
const {buildLeagueInviteUrl}=require('./league-invite-share');

test('league invite keeps inviter, league id and existing join code',()=>{
  const url=buildLeagueInviteUrl('https://bizim-skor-live.vercel.app/','Erdal','11111111-1111-4111-8111-111111111111','ABCDEF12');
  const parsed=new URL(url);
  assert.equal(parsed.searchParams.get('invite'),'Erdal');
  assert.equal(parsed.searchParams.get('league'),'11111111-1111-4111-8111-111111111111');
  assert.equal(parsed.searchParams.get('lig'),'ABCDEF12');
});

test('league invite requires inviter and join code',()=>{
  assert.equal(buildLeagueInviteUrl('https://x.test/','','id','CODE'),null);
  assert.equal(buildLeagueInviteUrl('https://x.test/','Erdal','id',''),null);
});

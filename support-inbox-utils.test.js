const test=require('node:test');
const assert=require('node:assert/strict');
const support=require('./support-inbox-utils.js');

test('rejects invalid category',()=>{
  assert.equal(support.validateSupportMessage({category:'x',message:'Merhaba'}).ok,false);
});

test('rejects messages over 500 chars',()=>{
  assert.equal(support.validateSupportMessage({category:'technical',message:'a'.repeat(501)}).ok,false);
});

test('detects unseen admin reply',()=>{
  assert.equal(support.hasUnreadAdminReply({admin_reply:'Yanıt',answered_at:'2026-09-11T12:00:00Z',player_seen_reply_at:null}),true);
});

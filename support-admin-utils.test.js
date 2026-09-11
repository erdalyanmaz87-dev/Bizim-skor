const test=require('node:test');
const assert=require('node:assert/strict');
const admin=require('./support-admin-utils.js');
test('accepts valid admin reply',()=>assert.equal(admin.validateAdminReply('Kontrol edildi.').ok,true));
test('rejects empty admin reply',()=>assert.equal(admin.validateAdminReply('   ').ok,false));
test('rejects replies over 1000 chars',()=>assert.equal(admin.validateAdminReply('a'.repeat(1001)).ok,false));
test('normalizes allowed status filter',()=>assert.equal(admin.normalizeSupportStatus(' ANSWERED '),'answered'));
test('rejects invalid status filter',()=>assert.equal(admin.normalizeSupportStatus('abc'),null));

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { handleAction, validName } from '../../supabase/functions/mobile-account-auth/core.mjs';

function provider(overrides = {}) {
  const calls = [];
  return {
    calls,
    gate: async (...args) => { calls.push(['gate', ...args]); return true; },
    resolveEmail: async name => { calls.push(['lookup', name]); return name === 'Ali' ? 'private@example.com' : null; },
    passwordSignIn: async (...args) => { calls.push(['password', ...args]); return { error: true }; },
    signup: async (...args) => { calls.push(['signup', ...args]); return {}; },
    recover: async (...args) => { calls.push(['recover', ...args]); return {}; },
    ...overrides,
  };
}
test('username and email failures use identical public errors without disclosing lookup email', async () => {
  for (const identifier of ['Ali', 'Missing', 'owner@example.com']) {
    const deps = provider();
    const result = await handleAction({ action: 'login', identifier, password: 'correctly-long' }, deps);
    assert.deepEqual(result, { status: 401, body: { error: 'invalid_credentials' } });
    assert.equal(deps.calls.filter(call => call[0] === 'password').length, 1);
    assert.doesNotMatch(JSON.stringify(result), /private@example|owner@example/);
  }
});
test('login returns only confirmed successful provider session', async () => {
  for (const confirmed of [false, true]) {
    const session = { access_token: 'synthetic-token', refresh_token: 'synthetic-refresh', user: { email_confirmed_at: confirmed ? '2026-01-01' : null } };
    const result = await handleAction({ action: 'login', identifier: 'Ali', password: 'correctly-long' }, provider({ passwordSignIn: async () => ({ session }) }));
    assert.equal(result.status, confirmed ? 200 : 401);
    if (confirmed) assert.deepEqual(result.body, { session });
  }
});
test('denied rate gate prevents private lookup and provider calls for every action', async () => {
  for (const action of ['login', 'signup', 'recover']) {
    const deps = provider({ gate: async () => false });
    const result = await handleAction({ action, identifier: 'Ali', email: 'a@example.com', name: 'Ali', password: 'correctly-long' }, deps);
    assert.equal(result.status, 429);
    assert.deepEqual(deps.calls, []);
  }
});
test('recovery unknown address and provider user errors retain generic response', async () => {
  for (const email of ['missing@example.com', 'known@example.com', 'not-email']) {
    const result = await handleAction({ action: 'recover', email }, provider({ recover: async () => ({ error: 'user_not_found' }) }));
    assert.deepEqual(result, { status: 200, body: { ok: true } });
  }
});
test('signup mail failures are actionable; recovery delivery errors never enumerate addresses', async () => {
  const input = { email: 'a@example.com', name: 'Ali', password: 'correctly-long' };
  assert.deepEqual(await handleAction({ ...input, action: 'signup' }, provider({ signup: async () => ({ unavailable: true }) })), { status: 503, body: { error: 'email_service_unavailable' } });
  for (const recover of [async () => ({ unavailable: true }), async () => { throw new Error('SMTP private detail'); }]) {
    assert.deepEqual(await handleAction({ ...input, action: 'recover' }, provider({ recover })), { status: 200, body: { ok: true } });
  }
});
test('signup validates before provider call and never returns Auth session', async () => {
  for (const password of ['1234567', 'x'.repeat(257)]) {
    const deps = provider();
    assert.equal((await handleAction({ action: 'signup', email: 'a@example.com', name: 'Ali', password }, deps)).status, 400);
    assert.equal(deps.calls.some(call => call[0] === 'signup'), false);
  }
  assert.equal(validName('Çağrı'), true);
  assert.equal(validName('owner@example.com'), false);
  const deps = provider();
  assert.deepEqual(await handleAction({ action: 'signup', email: 'a@example.com', name: '  Ali  ', password: 'correctly-long' }, deps), { status: 200, body: { needsConfirmation: true } });
  assert.deepEqual(deps.calls.at(-1), ['signup', 'a@example.com', 'correctly-long', 'Ali']);
});
test('auto-confirm configuration and private DB failure fail closed', async () => {
  assert.deepEqual(await handleAction({ action: 'signup', email: 'a@example.com', name: 'Ali', password: 'correctly-long' }, provider({ signup: async () => ({ configurationError: true }) })), { status: 503, body: { error: 'email_confirmation_required' } });
  const result = await handleAction({ action: 'login', identifier: 'Ali', password: 'correctly-long' }, provider({ resolveEmail: async () => { throw new Error('email=private@example.com'); } }));
  assert.deepEqual(result, { status: 503, body: { error: 'auth_service_unavailable' } });
});
test('SQL boundary contract keeps privileged gateway separate from user identity RPCs', async () => {
  const sql = await readFile(new URL('../../supabase/mobile-account-auth.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(sql, /\b(drop|truncate)\s+(table|schema)|user_metadata|raw_user_meta_data/i);
  for (const table of ['player_accounts', 'auth_rate_buckets', 'account_deletion_requests']) {
    assert.match(sql, new RegExp(`alter table mobile_private\\.${table} enable row level security`, 'i'));
  }
  for (const name of ['mobile_link_player', 'mobile_create_player', 'mobile_issue_player_session', 'mobile_request_account_deletion', 'mobile_cancel_account_deletion', 'mobile_account_status']) {
    const body = sql.split(`create or replace function public.${name}(`)[1]?.split('end; $$;')[0];
    assert.ok(body, name);
    assert.match(body, /mobile_private\.verified_uid\(\)/);
    assert.match(body, /security definer set search_path=''/);
  }
  assert.match(sql, /revoke all on function public\.mobile_auth_email_for_name\(text\) from public,anon,authenticated/);
  assert.match(sql, /references public\.players\(id\) on delete restrict/);
  assert.match(sql, /email_confirmed_at is not null/);
  assert.match(sql, /interval '30 days'/);
});
test('email-only players cannot enter the legacy unset-PIN or registered-device recovery paths', async () => {
  const sql = await readFile(new URL('../../supabase/mobile-account-auth.sql', import.meta.url), 'utf8');
  const create = sql.split('create or replace function public.mobile_create_player(')[1]?.split('end; $$;')[0];
  assert.match(create, /insert into public\.players\(name,device_id,last_seen,pin_hash,force_pin_once\)/);
  assert.match(create, /values\(v_name,null,now\(\),extensions\.crypt\(encode\(extensions\.gen_random_bytes\(32\),'hex'\),extensions\.gen_salt\('bf'\)\),false\)/);
});

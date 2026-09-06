const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sqlPath = path.join(__dirname, 'supabase-invite-growth.sql');

test('invite SQL defines unique invited-player attribution and self-invite protection', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.match(sql, /invited_player_id[\s\S]*unique/i);
  assert.match(sql, /check\s*\(\s*inviter_id\s*<>\s*invited_player_id\s*\)/i);
  assert.match(sql, /created_at/i);
  assert.match(sql, /league_id/i);
});

test('invite SQL exposes idempotent record and aggregate RPC contracts', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.match(sql, /function\s+public\.record_invite_attribution/i);
  assert.match(sql, /on conflict\s*\(invited_player_id\)\s*do nothing/i);
  assert.match(sql, /function\s+public\.get_invite_leaderboard/i);
});

test('invite table is protected by RLS and direct client writes are revoked', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke\s+insert\s*,\s*update\s*,\s*delete[\s\S]*from\s+anon\s*,\s*authenticated/i);
});

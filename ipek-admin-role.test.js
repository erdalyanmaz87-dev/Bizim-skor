const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

function migrationSql() {
  const matches = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('_ipek_admin_role.sql'));

  assert.equal(
    matches.length,
    1,
    'İpek yönetici yetkisi için tek bir ipek_admin_role migrationı olmalı',
  );

  return fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
}

test('Erdal ve İpek support_admins tablosuna yönetici olarak eklenir', () => {
  const sql = migrationSql();

  assert.match(sql, /insert\s+into\s+public\.support_admins\s*\(player_id\)/i);
  assert.match(sql, /'Erdal'/);
  assert.match(sql, /'İpek'/);
  assert.match(sql, /coalesce\s*\(p\.is_active\s*,\s*true\)/i);
  assert.match(sql, /on\s+conflict\s*\(player_id\)\s+do\s+nothing/i);
});

test('is_support_admin sabit Erdal kontrolü yerine yönetici tablosunu kullanır', () => {
  const sql = migrationSql();

  assert.match(sql, /create\s+or\s+replace\s+function\s+public\.is_support_admin\s*\(p_token\s+text\)/i);
  assert.match(sql, /from\s+public\.support_admins\s+a/i);
  assert.match(sql, /public\.friend_session_player\s*\(p_token\)/i);
  assert.match(sql, /set\s+search_path\s*=\s*''/i);
  assert.doesNotMatch(sql, /=\s*'erdal'/i);
});

test('is_support_admin yalnızca RPC rolleri için açık tutulur', () => {
  const sql = migrationSql();

  assert.match(
    sql,
    /revoke\s+all\s+on\s+function\s+public\.is_support_admin\s*\(text\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i,
  );
  assert.match(
    sql,
    /grant\s+execute\s+on\s+function\s+public\.is_support_admin\s*\(text\)\s+to\s+anon\s*,\s*authenticated/i,
  );
});

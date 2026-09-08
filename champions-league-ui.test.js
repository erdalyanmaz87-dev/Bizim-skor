const fs = require('fs');
const path = require('path');
const assert = require('assert');

const migration = fs.readFileSync(
  path.join(__dirname, 'supabase/migrations/20260908203000_hafsa_one_time_champions_unlock.sql'),
  'utf8'
);

assert.match(migration, /champions_league_one_time_unlocks/);
assert.match(migration, /where p\.name = 'HAFSA'/);
assert.match(migration, /u\.player_id = v_player_id/);
assert.match(migration, /u\.consumed_at is null/);
assert.match(migration, /now\(\) >= v_lock_time and not v_has_unlock/);
assert.match(migration, /set consumed_at = now\(\)/);
assert.match(migration, /jsonb_array_length\(p_predictions\)<>v_fixture_count/);

console.log('Hafsa one-time Champions League unlock contract: OK');

const fs=require('fs');
const assert=require('assert');

const sql=fs.readFileSync('supabase/migrations/20261006052830_keep_managed_players_active.sql','utf8');

assert.match(sql,/lower\(trim\(p\.name\)\)\s+in\s+\('mertshen',\s*'mevlüt'\)\s+then false/i);
assert.match(sql,/update public\.players[\s\S]*set is_active\s*=\s*true[\s\S]*'mertshen'[\s\S]*'mevlüt'/i);
assert.match(sql,/create or replace function public\.get_admin_statistics_dashboard_base\(p_token text\)/i);

console.log('assistant managed players inactivity contract ok');

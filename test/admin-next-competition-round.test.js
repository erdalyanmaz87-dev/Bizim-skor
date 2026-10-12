const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(
  __dirname,
  '../supabase/migrations/20261012183500_admin_next_competition_round.sql',
);

test('yönetici özeti sıradaki turu üç organizasyonun tarihinden seçer', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'yeni migration bulunmalı');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /from public\.fixtures/i);
  assert.match(sql, /from public\.champions_league_fixtures/i);
  assert.match(sql, /from public\.nations_league_fixtures/i);
  assert.match(sql, /where[\s\S]*kickoff\s*>\s*now\(\)/i);
  assert.match(sql, /order by[\s\S]*kickoff[\s\S]*limit 1/i);
  assert.match(sql, /'competition',[\s\S]*v_competition/i);
  assert.match(sql, /champions_league_predictions/i);
  assert.match(sql, /nations_league_predictions/i);
  assert.match(sql, /prediction_reminder_events[\s\S]*competition\s*=\s*v_competition/i);
});

test('yönetici özeti seçilen organizasyonun adını ve haftasını gösterir', () => {
  const dashboard = require('../admin-statistics-dashboard.js');
  const html = dashboard.render({
    season: '2026/27',
    competition: 'champions',
    competition_label: 'Şampiyonlar Ligi',
    week: 2,
    summary: {},
    players: [],
  });
  assert.match(html, /Şampiyonlar Ligi\s*•\s*2\. Hafta/);
});

test('yönetici özeti ön yüz düzeltmesi eski tarayıcı önbelleğinde kalmaz', () => {
  const loader = fs.readFileSync(
    path.join(__dirname, '../ui-integration-loader.js'),
    'utf8',
  );
  assert.match(loader, /20261012-admin-next-round-v1/);
});

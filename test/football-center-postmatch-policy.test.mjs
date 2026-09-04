import test from 'node:test';
import assert from 'node:assert/strict';
import {postMatchCategories,isSupportedFootballCenterMode} from '../supabase/functions/football-center-sync/mode-policy.mjs';

test('maç günü güncellemesi yalnız puan, gol ve asist verilerini ister',()=>{
  assert.deepEqual(postMatchCategories(),['standings','top_scorers','top_assists']);
});

test('otomatik akışta sakatlık ve gece kurtarma modları kapalıdır',()=>{
  assert.equal(isSupportedFootballCenterMode('matchday_complete'),true);
  assert.equal(isSupportedFootballCenterMode('manual'),true);
  assert.equal(isSupportedFootballCenterMode('availability_24h'),false);
  assert.equal(isSupportedFootballCenterMode('nightly_recovery'),false);
});

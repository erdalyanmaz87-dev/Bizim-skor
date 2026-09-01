import test from 'node:test';
import assert from 'node:assert/strict';
import {reminderThreshold,predictionIsComplete,exactScoreReached,deliveryKey} from '../supabase/functions/notification-dispatch/core.mjs';

test('24 ve 3 saat pencerelerini yalnız ilgili aralıkta seçer',()=>{
  assert.equal(reminderThreshold(23.9),'24h');
  assert.equal(reminderThreshold(2.9),'3h');
  assert.equal(reminderThreshold(25),null);
  assert.equal(reminderThreshold(-1),null);
});

test('hafta tahmini yalnız tüm maçlar doldurulduğunda tamamdır',()=>{
  assert.equal(predictionIsComplete(9,9),true);
  assert.equal(predictionIsComplete(8,9),false);
  assert.equal(predictionIsComplete(0,9),false);
});

test('canlı skor tam tahminle eşleşir',()=>{
  assert.equal(exactScoreReached({home_score:2,away_score:0},{home_score:2,away_score:0}),true);
  assert.equal(exactScoreReached({home_score:2,away_score:0},{home_score:2,away_score:1}),false);
  assert.equal(exactScoreReached({home_score:2,away_score:0},null),false);
});

test('teslim anahtarı olay oyuncu cihaz bazında kararlıdır',()=>{
  assert.equal(deliveryKey('exact:44','Erdal','endpoint-a'),'exact:44|erdal|endpoint-a');
});
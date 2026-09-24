import test from 'node:test';
import assert from 'node:assert/strict';
import * as Core from '../supabase/functions/notification-dispatch/core.mjs';
const {reminderThreshold,predictionIsComplete,exactScoreReached,deliveryKey}=Core;

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

test('hatırlatma planı üç ligin haftalarını bağımsız işler',()=>{
  assert.equal(typeof Core.reminderCompetitions,'function');
  const competitions=Core.reminderCompetitions();
  assert.deepEqual(competitions.map(x=>x.code),['super','champions','nations']);
  assert.deepEqual(competitions.map(x=>x.fixtureTable),['fixtures','champions_league_fixtures','nations_league_fixtures']);
  assert.deepEqual(competitions.map(x=>x.predictionTable),['predictions','champions_league_predictions','nations_league_predictions']);
});

test('aynı hafta ve eşik farklı liglerde farklı teslim anahtarı üretir',()=>{
  assert.equal(typeof Core.reminderEventKey,'function');
  assert.equal(Core.reminderEventKey('super','2026/27',1,'24h'),'reminder:super:2026/27:1:24h');
  assert.equal(Core.reminderEventKey('champions','2026/27',1,'24h'),'reminder:champions:2026/27:1:24h');
  assert.equal(Core.reminderEventKey('nations','2026/27',1,'3h'),'reminder:nations:2026/27:1:3h');
});

test('kupa bildirimleri lig ve hafta adını açıkça taşır',()=>{
  assert.equal(typeof Core.reminderCopy,'function');
  assert.deepEqual(Core.reminderCopy('Şampiyonlar Ligi',2,'24h'),{
    title:'Şampiyonlar Ligi 2. Hafta tahminlerini unutma!',
    body:'Tahminlerin 24 saat sonra, ilk maç başladığında kapanacak.'
  });
  assert.deepEqual(Core.reminderCopy('Uluslar Ligi',1,'3h'),{
    title:'Uluslar Ligi 1. Hafta tahminlerini unutma!',
    body:'Tahminlerin 3 saat sonra, ilk maç başladığında kapanacak.'
  });
});

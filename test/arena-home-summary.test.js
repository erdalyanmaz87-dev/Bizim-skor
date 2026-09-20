const test=require('node:test');
const assert=require('node:assert/strict');
const UI=require('../league-system-ui');

test('ana sayfa Arena özetinde ortalama puan ve katılım görünür',()=>{
  const html=UI.renderLeagueSummary({is_eligible:false,valid_round_count:1,rounds_needed:1,league_code:'gold',rank_in_league:3,league_size:12,performance_score:75});
  assert.match(html,/Ort\. Arena Puanı 75\.00/);
  assert.match(html,/Katılım 1 \/ 2/);
});

test('kurallar kupa puanlarının ortalamaya katılıp tur sayısını artırmadığını açıklar',()=>{
  const html=UI.renderLeagueRules();
  assert.match(html,/Uluslar Ligi/);
  assert.match(html,/Şampiyonlar Ligi/);
  assert.match(html,/ortalama Arena puanına/);
  assert.match(html,/tur sayısını artırmaz/);
});

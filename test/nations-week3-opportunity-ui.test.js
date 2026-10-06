const test=require('node:test');
const assert=require('node:assert/strict');
const Opportunity=require('../opportunity-match-utils.js');

test('Fransa - İtalya 3. hafta maçı Uluslar Ligi fırsat maçıdır',()=>{
  assert.equal(Opportunity.isNationsOpportunity({fixture_id:9022,week:3}),true);
  assert.equal(Opportunity.pointsForNations({fixture_id:9022,week:3,home_score:2,away_score:1},{home_score:2,away_score:1}),8);
});

test('Uluslar Ligi 5 ve 6. hafta fırsat maçları iki kat puan verir',()=>{
  assert.equal(Opportunity.isNationsOpportunity({fixture_id:9034,week:5}),true);
  assert.equal(Opportunity.isNationsOpportunity({fixture_id:9044,week:6}),true);
  assert.equal(Opportunity.pointsForNations({fixture_id:9034,week:5,home_score:2,away_score:1},{home_score:2,away_score:1}),8);
  assert.equal(Opportunity.pointsForNations({fixture_id:9044,week:6,home_score:1,away_score:0},{home_score:2,away_score:0}),2);
});

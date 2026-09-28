const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Opportunity=require('../opportunity-match-utils.js');

test('Fransa - İtalya 3. hafta maçı Uluslar Ligi fırsat maçıdır',()=>{
  assert.equal(Opportunity.isNationsOpportunity({fixture_id:9022,week:3}),true);
  assert.equal(Opportunity.pointsForNations({fixture_id:9022,week:3,home_score:2,away_score:1},{home_score:2,away_score:1}),8);
});

test('Fırsat Maçları ekranı Uluslar Ligi 3. haftada Fransa - İtalya maçını gösterir',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../opportunity-match-ui.js'),'utf8');
  assert.match(source,/UEFA Uluslar Ligi 3\. Hafta/);
  assert.match(source,/Fransa/);
  assert.match(source,/İtalya/);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const brand=require('./brand-assets.js');
const superFix=require('./superlig-logo-fix.js');
const championsFix=require('./champions-stats-logo-fix.js');
const teams=['Kocaelispor','Shakhtar Donetsk','LASK','Slovan Bratislava','Bodo/Glimt','AEK','Como','Slavia Prag','Club Brugge','Viking','Sabah'];
test('missing crests resolve to bundled, decodable image assets in every logo path',()=>{
 for(const name of teams){
  const url=brand.teamLogoUrl(name);
  assert.match(url,/^assets\/team-logos\//,name);
  const data=fs.readFileSync(url);
  assert.ok(data.length>1000,name);
  assert.ok(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||data.toString().includes('<svg'),name);
  assert.ok(brand.teamMarkup(name).includes(`src="${url}"`),name);
 }
 assert.equal(superFix.logoFor('Kocaelispor'),brand.teamLogoUrl('Kocaelispor'));
 for(const name of ['Sabah','Slavia Prag'])assert.equal(championsFix.logoUrlForTeam(name),brand.teamLogoUrl(name));
 const source=fs.readFileSync('prediction-visibility-logo-fix.js','utf8');
 assert.ok(source.includes("'kocaelispor':'assets/team-logos/kocaelispor.png'"));
});

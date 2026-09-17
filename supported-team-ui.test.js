const assert=require('assert');
const feature=require('./supported-team-ui.js');

assert.strictEqual(feature.TEAMS.length,18,'Süper Lig takım seçici 18 takım göstermeli');
assert.strictEqual(new Set(feature.TEAMS.map(x=>x.code)).size,18,'takım kodları benzersiz olmalı');

const clean=feature.normalizeTeamMap([
  {name:'Erdal',supported_team:'galatasaray'},
  {name:'İpek',supported_team:'fenerbahce'}
]);
assert.strictEqual(clean.get('erdal'),'galatasaray');
assert.strictEqual(clean.get('ipek'),'fenerbahce');

const html=feature.teamPickerMarkup();
assert.ok(html.includes('Takımını seç'),'seçim başlığı görünmeli');
assert.ok(html.includes('Takım seçimi tek seferliktir'),'tek seferlik uyarı görünmeli');
assert.ok(html.includes('data-supported-team-code="galatasaray"'),'takım kartları seçim kodu taşımalı');

const logo=feature.playerLogoMarkup('galatasaray','Galatasaray');
assert.ok(logo.includes('bs-supported-team-logo'),'oyuncu logosu sınıfı olmalı');
assert.ok(logo.includes('<img'),'logo görseli üretilmeli');

console.log('supported-team-ui ok');

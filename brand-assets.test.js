const assert=require('assert');
const brand=require('./brand-assets.js');

assert.match(brand.competitionLogoMarkup('champions','Şampiyonlar Ligi'),/uefa-champions-league-logo-footylogos\.svg/);
assert.match(brand.competitionLogoMarkup('super','Süper Lig'),/super-lig-turkey-logo-footylogos\.svg/);
assert.match(brand.competitionLogoMarkup('nations','Uluslar Ligi'),/uefa-nations-league-logo-footylogos\.svg/);

const kasimpasa=brand.teamMarkup('KASIMPAŞA A.Ş.');
assert.match(kasimpasa,/kasimpasa-logo-footylogos\.svg/);
assert.match(kasimpasa,/KASIMPAŞA A\.Ş\./);
const konyaspor=brand.teamMarkup('TÜMOSAN KONYASPOR');
assert.match(konyaspor,/konyaspor-logo-footylogos\.svg/);
assert.match(konyaspor,/TÜMOSAN KONYASPOR/);
assert.match(brand.teamMarkup('Bilinmeyen Takım'),/bs-team-fallback/);

assert.strictEqual(brand.teamSlug('GALATASARAY A.Ş.'),'galatasaray');
assert.strictEqual(brand.teamSlug('AMED SPORTİF FAALİYETLER'),'amed-sk');
assert.strictEqual(brand.teamSlug('ARCA ÇORUM FK'),'corum-fk');
console.log('brand assets ok');

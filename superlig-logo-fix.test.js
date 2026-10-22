const assert=require('assert');
const fix=require('./superlig-logo-fix.js');

assert.strictEqual(fix.teamKey('Kocaelispor'),'kocaelispor');
assert.strictEqual(fix.teamKey('Erzurumspor FK'),'erzurumspor');
assert.strictEqual(fix.teamKey('Ç. Rizespor'),'rizespor');
assert.strictEqual(fix.teamKey('Çaykur Rizespor'),'rizespor');

assert.strictEqual(fix.logoFor('Kocaelispor'),'assets/team-logos/kocaelispor.png');
assert.match(fix.logoFor('Erzurumspor FK'),/erzurumsporfk\.org\/wp-content\/uploads\/2025\/08\/erzurumsporfklogo\.png/);
assert.match(fix.logoFor('Ç. Rizespor'),/rizespor\.bb8c7526\.png/);
assert.strictEqual(fix.logoFor('Galatasaray'),null);

console.log('superlig missing logo fix ok');

const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('admin-inactive-21d.js','utf8');
const inactiveUi=require('./admin-inactive-21d');
assert(src.includes('21 Gündür Oyuna Girmeyen'));
assert(src.includes('Aktif Oyuncu'));
assert(src.includes('Toplam Oyuncu'));
assert(src.includes('Aktif Katılım'));
assert(src.includes('total_registered'));
assert(src.includes('inactive_21d'));
assert(src.includes('data-admin-stats-toggle'));
assert(src.includes('bs-admin-stats-extra'));
assert(src.includes('get_admin_statistics_dashboard'));
assert(!src.includes('MutationObserver'));
assert.strictEqual(inactiveUi.isAssistantManagedPlayer(' MERTSHEN '),true);
assert.strictEqual(inactiveUi.isAssistantManagedPlayer('Mevlüt'),true);
assert.strictEqual(inactiveUi.isAssistantManagedPlayer('Erdal'),false);
assert.deepStrictEqual(
  inactiveUi.withoutAssistantManagedPlayers([
    {player_name:'Mertshen'},
    {player_name:'Mevlüt'},
    {player_name:'Erdal'}
  ]),
  [{player_name:'Erdal'}]
);
console.log('admin inactive 21d contract ok');

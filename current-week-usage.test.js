const test = require('node:test');
const assert = require('node:assert/strict');
const dashboard = require('./admin-statistics-dashboard.js');
test('animation usage identifies the current competition and prediction week', () => {
  const html = dashboard.render({skorbot_animation_usage:{season:'2026/27',competition_label:'Süper Lig',week:8,total_plays:2,unique_players:1,players:[{player_name:'Oyuncu',play_count:2}]}});
  const section = html.slice(html.indexOf('⚽ Gol Animasyonu Kullanımı'), html.indexOf('Oyuna Girenler'));
  assert.match(section, /Süper Lig • 8\. Hafta/);
  assert.match(section, /Yalnızca bu haftanın/);
  assert.doesNotMatch(section, /Veriler, kullanım takibi etkinleştirildikten/);
});

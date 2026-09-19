const assert = require('node:assert/strict');
const dashboard = require('./admin-statistics-dashboard');

const html = dashboard.render({
  summary: { total_players: 4, team_selected: 3, team_unselected: 1 },
  players: [],
  team_distribution: [
    { team: 'galatasaray', count: 2 },
    { team: 'fenerbahce', count: 1 },
  ],
});

assert.match(html, /Takımını Seçen/);
assert.match(html, />3</);
assert.match(html, /Takımını Seçmeyen/);
assert.match(html, />1</);
assert.match(html, /Takım Dağılımı/);
assert.match(html, /Galatasaray/);
assert.match(html, /2 kişi/);
assert.match(html, /Fenerbahçe/);
assert.match(html, /1 kişi/);

console.log('admin team summary render ok');

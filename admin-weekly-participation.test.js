const assert=require('assert');
const feature=require('./admin-weekly-participation.js');
const html=feature.render([
  {week:3,completed:43,total_players:48,participation:89.6},
  {week:4,completed:55,total_players:64,participation:85.9},
  {week:5,completed:65,total_players:79,participation:82.3},
  {week:6,completed:63,total_players:83,participation:75.9},
  {week:7,completed:69,total_players:89,participation:77.5}
]);
assert(html.includes('Haftalara Göre Katılım'));
assert(html.includes('5. Hafta'));
assert(html.includes('%82.3'));
assert(html.includes('65 / 79'));
assert(html.includes('7. Hafta'));
assert(html.includes('%77.5'));
assert(html.includes('data-admin-weekly-participation'));
console.log('admin weekly participation render ok');

const assert=require('assert');
const feature=require('./admin-supported-team-stats.js');
const data={selected_count:2,unselected_count:1,selected:[{player_name:'Erdal',supported_team:'galatasaray'},{player_name:'İpek',supported_team:'fenerbahce'}],unselected:[{player_name:'Davut',supported_team:null}]};
const html=feature.render(data);
assert(html.includes('Takım Seçen'));
assert(html.includes('Takım Seçmeyen'));
assert(html.includes('Erdal')&&html.includes('İpek')&&html.includes('Davut'));
assert(html.includes('2')&&html.includes('1'));
console.log('admin supported team stats ok');

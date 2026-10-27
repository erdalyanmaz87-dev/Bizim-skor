const test=require('node:test');
const assert=require('node:assert/strict');
const dashboard=require('../admin-statistics-dashboard.js');
test('admin domain summary shows unique counts, escaped names and missing-data state',()=>{
 const html=dashboard.render({players:[],domain_launch_usage:{today_players:1,week_players:2,total_players:2,players:[{player_name:'<Erdal>',last_launch:'2026-10-27T07:00:00Z',launch_count:3}]}});
 assert.ok(html.includes('bizimskor.com Girişleri'));
 assert.ok(html.includes('&lt;Erdal&gt;'));
 assert.ok(html.includes('3 giriş'));
 assert.ok(!html.includes('<Erdal>'));
 assert.ok(dashboard.render({players:[]}).includes('Alan adı istatistikleri şu anda alınamıyor.'));
});

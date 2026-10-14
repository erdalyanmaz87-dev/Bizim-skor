const test=require('node:test'),assert=require('node:assert/strict'),cup=require('../cup-ui');
const base={status:'running',count:51,start_week:8,entries:[],revealed_pairs:32,matches:[{round:1,position:1,name_a:'Erdal',name_b:'Rakip',points_a:100,points_b:60}],round_states:[{round:1,completed:1,total:9,complete:false}]};
test('one live notice appears above the whole bracket, never beside every point',()=>{
 const html=cup.render(base,'bracket',1);
 assert.equal((html.match(/Canlı puanlar/g)||[]).length,1);assert.match(html,/Hafta tamamlanana kadar değişebilir/);
 assert.match(html,/>100<\/b>/);assert.match(html,/>60<\/b>/);assert.doesNotMatch(html,/Erdal üst turda/);
});
test('completed round has one confirmed notice',()=>{
 const html=cup.render({...base,round_states:[{round:1,completed:9,total:9,complete:true}]},'bracket',1);
 assert.match(html,/Tur sonuçları kesinleşti/);assert.doesNotMatch(html,/Canlı puanlar/);
});
test('unstarted round does not imply results are live',()=>{
 const html=cup.render({...base,round_states:[{round:1,completed:0,total:9,complete:false}]},'bracket',1);
 assert.match(html,/Tur henüz başlamadı/);assert.doesNotMatch(html,/Canlı puanlar/);
});

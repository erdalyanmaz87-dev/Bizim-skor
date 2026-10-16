const test=require('node:test'),assert=require('node:assert/strict'),cup=require('../cup-ui');
const state={status:'running',count:60,start_week:8,entries:[],matches:[{round:1,position:1,name_a:'Soner',name_b:'Damla',points_a:30,points_b:36.67},{round:1,position:2,name_a:'Mertshen',name_b:'BAY',points_a:13.33,points_b:null,winner:'Mertshen',tie_reason:'BAY'},{round:2,position:1,name_a:null,name_b:'Mertshen',points_a:null,points_b:null}],round_states:[{round:1,completed:1,total:9}]};
test('overview includes all 63 matches plus third place in a mirrored tree',()=>{
 const html=cup.overview(state);
 assert.equal((html.match(/data-overview-match=/g)||[]).length,64);
 assert.match(html,/data-overview-side="left"/);assert.match(html,/data-overview-side="right"/);
 assert.match(html,/FİNAL/);assert.match(html,/ÜÇÜNCÜLÜK/);
});
test('overview uses actual scores, highlights provisional leaders and preserves BAY advancement',()=>{
 const html=cup.overview(state);
 assert.match(html,/is-leading[^]*Damla[^]*36,67/);
 assert.match(html,/Soner/);assert.match(html,/Mertshen/);assert.match(html,/BAY/);
 assert.doesNotMatch(html,/Damla üst turda/);
 assert.match(html,/13,33/);
});
test('overview escapes names and does not invent future winners',()=>{
 const html=cup.overview({...state,matches:[{round:1,position:1,name_a:'<script>alert(1)</script>',name_b:'B',points_a:100,points_b:0}]});
 assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/Son 64 · 1 galibi/);
});
test('zoom supports fitting and readable zoom without unbounded scales',()=>{
 assert.equal(cup.overviewScale(280,null),.1);
 assert.equal(cup.overviewScale(280,.7),.7);
 assert.equal(cup.overviewScale(280,10),1.2);
 assert.equal(cup.overviewScale(280,.01),.1);
});
test('live cup starts with overview controls and retains round detail navigation',()=>{
 const html=cup.render(state,'bracket',1);
 assert.match(html,/data-cup-overview/);assert.match(html,/data-cup-zoom="in"/);assert.match(html,/data-cup-zoom="read"/);
 assert.match(html,/data-cup-round="1"/);assert.match(html,/data-cup-detail/);
});

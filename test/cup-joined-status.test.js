const test=require('node:test'),assert=require('node:assert/strict'),cup=require('../cup-ui');
const state={status:'registration',count:32,start_week:8,entries:[{number:26,name:'Fahri'}],matches:[]};
test('existing participant sees confirmation and own number without another join action',()=>{const html=cup.render({...state,my_number:26});assert.match(html,/Katılımın alındı/);assert.match(html,/Katılım numaran: 26/);assert.doesNotMatch(html,/data-cup-join/);assert.match(html,/Toplam katılımcı/)});
test('new player still has an application button',()=>{const html=cup.render({...state,my_number:null});assert.match(html,/data-cup-join/);assert.match(html,/Katılım için başvur/);assert.doesNotMatch(html,/Katılımın alındı/)});

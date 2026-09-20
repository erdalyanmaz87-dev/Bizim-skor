const test=require('node:test');
const assert=require('node:assert/strict');

function freshModule(){
  delete require.cache[require.resolve('../general-ranking-live-refresh')];
  return require('../general-ranking-live-refresh');
}

test('Arena özeti ana sayfada Günün Maçlarından önce öne çıkarılır',()=>{
  const api=freshModule();
  const created=[];
  const makeNode=tag=>({tag,id:'',className:'',innerHTML:'',children:[],parentNode:null,style:{},appendChild(child){child.parentNode=this;this.children.push(child);return child},prepend(child){child.parentNode=this;this.children.unshift(child);return child}});
  const home=makeNode('section');home.id='home';
  const daily=makeNode('div');daily.id='dailyMatches';daily.parentNode=home;
  daily.insertAdjacentElement=(position,node)=>{assert.equal(position,'beforebegin');node.parentNode=home;home.children.unshift(node)};
  home.children=[daily];
  const doc={
    getElementById(id){return [home,daily,...created].find(node=>node.id===id)||null},
    createElement(tag){const node=makeNode(tag);created.push(node);return node}
  };

  const result=api.ensureHomeArenaSpotlight(doc);

  assert.equal(home.children[0].id,'homeArenaSpotlight');
  assert.equal(home.children[1],daily);
  assert.equal(result.summaryHost.id,'personalLeagueSummary');
  assert.equal(result.summaryHost.parentNode,result.spotlight);
  assert.match(result.spotlight.innerHTML,/Arena Ligleri/);
  assert.match(result.spotlight.innerHTML,/1\. Sezon/);
});

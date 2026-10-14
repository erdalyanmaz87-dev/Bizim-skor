const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cup=require('../cup-ui');

const state=(matches=[])=>({status:'registration',count:44,start_week:8,matches});
const count=(text,pattern)=>(text.match(pattern)||[]).length;
const stage=(html,round)=>{
  const start=html.indexOf(`data-stage="${round}"`);
  const end=round<6?html.indexOf(`data-stage="${round+1}"`,start):html.length;
  return html.slice(start,end);
};

test('renders six ordered stage panels',()=>{
  const html=cup.bracket(state());
  let cursor=-1;
  for(let round=1;round<=6;round++){
    const next=html.indexOf(`data-stage="${round}"`);
    assert.ok(next>cursor,`stage ${round} should follow the previous stage`);
    cursor=next;
  }
});

test('renders 32 first-round matches and 64 waiting players before draw',()=>{
  const html=stage(cup.bracket(state()),1);
  assert.equal(count(html,/bsc-bracket-match--current/g),32);
  assert.equal(count(html,/Kura bekleniyor/g),64);
});

test('maps round positions without moving partial draw results',()=>{
  const html=cup.bracket(state([
    {round:1,position:1,name_a:'Birinci A',name_b:'Birinci B'},
    {round:1,position:32,name_a:'Son A',name_b:'Son B'}
  ]));
  assert.match(html,/data-round="1" data-position="1"[^]*Birinci A[^]*Birinci B/);
  assert.match(html,/data-round="1" data-position="32"[^]*Son A[^]*Son B/);
});

test('shows current and next round in each non-final panel',()=>{
  const html=cup.bracket(state());
  const first=stage(html,1),second=stage(html,2);
  assert.equal(count(first,/bsc-bracket-match--current/g),32);
  assert.equal(count(first,/bsc-bracket-match--next/g),16);
  assert.equal(count(second,/bsc-bracket-match--current/g),16);
  assert.equal(count(second,/bsc-bracket-match--next/g),8);
});

test('renders final with trophy',()=>{
  const html=stage(cup.bracket(state()),6);
  assert.equal(count(html,/bsc-bracket-match--current/g),1);
  assert.match(html,/class="bsc-bracket-trophy"/);
});

test('renders the third-place match below the final',()=>{
  const html=stage(cup.bracket(state([{round:6,position:1,bronze:true,name_a:'Yarı Final 1',name_b:'Yarı Final 2',points_a:82.5,points_b:64,winner:'Yarı Final 1'}])),6);
  assert.match(html,/Üçüncülük maçı/);
  assert.match(html,/Yarı Final 1/);
  assert.match(html,/Yarı Final 2/);
  assert.match(html,/bsc-bracket-bronze/);
});

test('escapes player names',()=>{
  const html=cup.bracket(state([{round:1,position:1,name_a:'<img src=x onerror=alert(1)>',name_b:'Normal'}]));
  assert.doesNotMatch(html,/<img src=x/);
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('stylesheet defines snap-scrolling linked bracket stages',()=>{
  const css=fs.readFileSync(require.resolve('../cup-ui.css'),'utf8');
  assert.match(css,/\.bsc-bracket-viewport\{[^}]*overflow-x:auto[^}]*scroll-snap-type:x mandatory/);
  assert.match(css,/\.bsc-bracket-stage\{[^}]*scroll-snap-align:start/);
  assert.match(css,/\.bsc-bracket-column--current/);
  assert.match(css,/\.bsc-bracket-column--next/);
  assert.match(css,/\.bsc-bracket-match--current::after/);
  assert.match(css,/border[^;]*#2f80ed/);
  assert.match(css,/\.bsc-bracket-trophy/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('each mobile bracket stage snaps at one viewport width',()=>{
  const css=fs.readFileSync(require.resolve('../cup-ui.css'),'utf8');
  assert.match(css,/\.bsc-bracket-stage\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)[^}]*flex:0 0 100%/);
  assert.doesNotMatch(css,/flex-basis:620px|flex:0 0 max\(100%,620px\)/);
});

test('round controls and stage panels have matching accessible links',()=>{
  const html=cup.render(state(), 'bracket', 3);
  const labels=['Son 64','Son 32','Son 16','Çeyrek final','Yarı final','Final'];
  labels.forEach((label,index)=>{
    const round=index+1;
    assert.match(html,new RegExp(`id="bscBracketRound-${round}"[^>]*aria-controls="bscBracketStage-${round}"[^>]*aria-pressed="${round===3}"[^>]*>${label}`));
    assert.match(html,new RegExp(`data-stage="${round}" id="bscBracketStage-${round}" aria-labelledby="bscBracketRound-${round}"`));
  });
});

test('syncBracketRound resolves and clamps the visible stage',()=>{
  assert.equal(cup.syncBracketRound({scrollLeft:0,clientWidth:320}),1);
  const stages=[0,620,1240,1860,2480,3100].map(offsetLeft=>({offsetLeft}));
  assert.equal(cup.syncBracketRound({scrollLeft:650,clientWidth:320,querySelectorAll:()=>stages}),2);
  assert.equal(cup.syncBracketRound({scrollLeft:5000,clientWidth:320}),6);
  assert.equal(cup.syncBracketRound({scrollLeft:0,clientWidth:0}),1);
});

test('syncBracketRound normalizes nonzero ancestor offsets',()=>{
  const stages=[417,1037,1657,2277,2897,3517].map(offsetLeft=>({offsetLeft}));
  assert.equal(cup.syncBracketRound({scrollLeft:620,clientWidth:620,querySelectorAll:()=>stages}),2);
});

test('revealBracketRound keeps the selected round button visible after refresh',()=>{
  const calls=[];
  const button={scrollIntoView:options=>calls.push(options)};
  const host={querySelector:selector=>selector==='[data-cup-round="6"]'?button:null};
  cup.revealBracketRound(host,6,'auto');
  assert.deepEqual(calls,[{behavior:'auto',inline:'center',block:'nearest'}]);
});

test('cup bracket assets use the new cache version',()=>{
  const ui=fs.readFileSync(require.resolve('../ui-integration-loader.js'),'utf8');
  const cupSource=fs.readFileSync(require.resolve('../cup-ui.js'),'utf8');
  assert.match(ui,/ASSET_VERSION='[^']*-cup-bracket-v1-cup-manual-v1'/);
  assert.match(cupSource,/cup-ui\.css\?v=20261014-cup-manual-v1/);
});

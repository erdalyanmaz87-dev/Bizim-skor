const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Bootstrap=require('./weekly-result-card-bootstrap');
const {latestCompletedWeek,findPlayerRow,selectCardWeek}=Bootstrap;

test('latestCompletedWeek returns latest week with every fixture finished',()=>{const fixtures=[{id:1,week:4},{id:2,week:4},{id:3,week:5},{id:4,week:5}];const results=[{fixture_id:1,home_score:1,away_score:0},{fixture_id:2,home_score:0,away_score:0},{fixture_id:3,home_score:2,away_score:1}];assert.equal(latestCompletedWeek(fixtures,results),4)});
test('selectCardWeek keeps completed week 4 visible after week 5 starts',()=>{const fixtures=[{id:1,week:4},{id:2,week:4},{id:3,week:5},{id:4,week:5}];const results=[{fixture_id:1,home_score:1,away_score:0},{fixture_id:2,home_score:0,away_score:0},{fixture_id:3,home_score:2,away_score:1}];assert.equal(selectCardWeek(fixtures,results),4)});
test('findPlayerRow matches Turkish names case-insensitively',()=>{assert.deepEqual(findPlayerRow([{name:'İpek',pts:8,rank:2}],'ipek'),{name:'İpek',pts:8,rank:2})});
test('weekly result bootstrap mounts a compact trigger and hidden modal instead of an always-visible card',()=>{const source=fs.readFileSync(require.resolve('./weekly-result-card-bootstrap'),'utf8');assert.match(source,/bsWeeklyResultTrigger/);assert.match(source,/bsWeeklyResultModal/)});
test('modalMarkup uses the same Premium V2 SVG used by image sharing',()=>{const model={player:'Erdal',week:3,points:3,exact:0,correct:3,weeklyRank:9,overallRank:17,movement:{direction:'down',value:11,label:'▼ 11'},inviteUrl:'https://example.test/?invite=Erdal'};const host={BizimSkorWeeklyResultImageShare:{buildCardSvg:()=>'<svg data-premium-v2="true"></svg>'},BizimSkorWeeklyResultCard:{renderWeeklyResultCard:()=>'<div data-old-card="true"></div>'}};const html=Bootstrap.modalMarkup(host,model);assert.match(html,/data-premium-v2="true"/);assert.doesNotMatch(html,/data-old-card="true"/);assert.match(html,/bs-weekly-result-preview/);assert.match(html,/Kartı Görsel Olarak Paylaş/)});

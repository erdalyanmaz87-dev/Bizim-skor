const assert=require('assert');
const nav=require('./simple-navigation.js');

assert.strictEqual(nav.canonicalTab('live'),'weeklyRankings');
assert.strictEqual(nav.canonicalTab('weeklyRankings'),'weeklyRankings');
assert.deepStrictEqual(nav.preferredTabNames('weeklyRankings'),['weeklyRankings','live']);
assert.strictEqual(nav.bottomTargetForTab('home'),'home');
assert.strictEqual(nav.bottomTargetForTab('pred'),'pred');
assert.strictEqual(nav.bottomTargetForTab('championsRanking'),'menu');
assert.strictEqual(nav.bottomTargetForTab('chat'),'menu');
assert.deepStrictEqual(nav.predictionProgress([]),{complete:0,total:0,percent:0});
assert.deepStrictEqual(nav.predictionProgress([true,false,true,false,false]),{complete:2,total:5,percent:40});

const groups=nav.groupedItems(['arena','championsRanking','nationsRanking','general','live','resultsWeek','footballCenter','friendLeagues','history','rules','chat']);
assert.deepStrictEqual(groups.map(group=>group.title),['Sıralamalar','Futbol','Sosyal','Hesabım','Bilgi']);
assert.deepStrictEqual(groups[0].items.map(item=>item.tab),['arena','championsRanking','nationsRanking','general','weeklyRankings']);
assert.deepStrictEqual(groups[1].items.map(item=>item.label),['Fikstür','Futbol Merkezi']);
assert.strictEqual(groups.flatMap(group=>group.items).some(item=>item.tab==='sezu'),false);

const bottom=nav.bottomMarkup('home',{complete:2,total:5,percent:40});
assert.strictEqual((bottom.match(/data-simple-nav=/g)||[]).length,4);
assert.match(bottom,/data-simple-nav="home"[^>]*aria-current="page"/);
assert.match(bottom,/>Tahmin Yap</);
assert.match(bottom,/data-simple-nav="predictionStatus"/);
assert.match(bottom,/Tahmin Durumu/);
assert.match(bottom,/%40/);

const drawer=nav.drawerMarkup(groups,{loggedIn:true});
assert.match(drawer,/id="bsSimpleNavDrawer"/);
assert.match(drawer,/data-simple-nav-group="rankings"/);
assert.match(drawer,/Süper Lig Genel Sıralaması/);
assert.match(drawer,/data-simple-account="update"/);
assert.match(drawer,/data-simple-account="museum"/);
assert.match(drawer,/data-simple-account="logout"/);
assert.match(drawer,/data-simple-account="inviteChampion"/);
assert.match(drawer,/Ayın Davet Şampiyonu/);

const guestDrawer=nav.drawerMarkup(groups,{loggedIn:false});
assert.match(guestDrawer,/data-simple-account="login"/);
assert.doesNotMatch(guestDrawer,/data-simple-account="logout"/);

console.log('simple-navigation ok');

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import {assertCleanSource,transformWebSource,shouldBundle,rankingRules} from '../store-cleanup.mjs';

const output = new URL('../www/', import.meta.url);
const read = name => readFile(new URL(name,output), 'utf8');
async function moduleApi(name, dependencies={}) {
  const context={module:{exports:{}},require:key=>dependencies[key],console};
  vm.runInNewContext(await read(name), context, {filename:name});
  return context.module.exports;
}

test('every shipped script and inline entry script parses after transformation', async()=>{
  for(const name of await readdir(output)) {
    if(name.endsWith('.js'))new vm.Script(await read(name),{filename:name});
  }
  const html=await read('index.html');
  for(const [tag,script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if(!tag.includes('application/ld+json'))new vm.Script(script,{filename:'index inline'});
  }
});

test('all shipped sources satisfy policy, with only own image files included',async()=>{
  const names=await readdir(output);
  for(const name of names){
    assert.equal(shouldBundle(name),true,name);
    if(/\.(js|html|css|webmanifest)$/.test(name))assertCleanSource(name,await read(name));
  }
  assert.equal(names.includes('assets'),false);
  assert.equal(names.includes('champions-prize-ball-v1.webp'),false);
  assert.equal(names.includes('gs-barca-preview.png'),false);
  assert.ok(names.includes('bizim-skor-logo-v2.png'));
});

test('critical and deferred dynamic loaders resolve to local cleaned modules',async()=>{
  const loader=await moduleApi('ui-integration-loader.js');
  const names=await readdir(output);
  for(const src of loader.scriptOrder())assert.ok(names.includes(src),src);
  assert.equal(loader.scriptOrder().includes('chat-unread-indicator.js'),false);
  assert.equal(loader.scriptOrder().includes('superlig-logo-fix.js'),false);
  assert.ok(loader.scriptOrder().includes('cup-ui.js'));
});

test('brand, team picker, competition and statistics APIs cannot produce crests',async()=>{
  const brand=await moduleApi('brand-assets.js');
  const visual=await moduleApi('brand-visual-ui.js',{'./brand-assets.js':brand});
  const supported=await moduleApi('supported-team-ui.js');
  const stats=await moduleApi('champions-stats-logo-fix.js');
  for(const team of ['Galatasaray','Kocaelispor','Sabah','Slavia Prag','Unknown <team>']) {
    assert.equal(brand.teamLogoUrl(team),null);
    assert.equal(brand.nationalTeamLogoUrl(team),null);
    assert.doesNotMatch(brand.teamMarkup(team),/<img|https?:/);
  }
  assert.match(brand.teamMarkup('<team>'),/&lt;team&gt;/);
  for(const kind of ['super','champions','nations']) {
    assert.doesNotMatch(brand.competitionLogoMarkup(kind,'Lig'),/<img|https?:/);
    assert.doesNotMatch(visual.competitionMarkup(kind,'Lig'),/<img|https?:/);
  }
  assert.doesNotMatch(supported.teamPickerMarkup(),/<img|https?:/);
  assert.match(supported.teamPickerMarkup(),/Galatasaray/);
  assert.equal(stats.logoUrlForTeam('Sabah'),null);
  assert.equal(typeof stats.injectStatistics,'function');
});

test('cup registration, running bracket and finished podium retain gameplay without prizes',async()=>{
  const cup=await moduleApi('cup-ui.js',{'./cup-overview':{render:()=>'',scale:()=>1}});
  const base={count:32,start_week:6,entries:[{number:1,name:'Oyuncu'}],matches:[]};
  const registration=cup.render({...base,status:'registration'},'join');
  assert.match(registration,/data-cup-join/);
  assert.match(registration,/0–100 performans puanı/);
  assert.match(registration,/Kupa kuralları/);
  const running=cup.render({...base,status:'running'},'bracket');
  assert.match(running,/bsc-bracket/);
  const finished=cup.render({...base,status:'finished',matches:[{round:6,winner:'Ali',name_a:'Ali',name_b:'Ayşe'},{round:6,bronze:true,winner:'Ece',name_a:'Ece',name_b:'Can'}]},'bracket');
  assert.match(finished,/Kupa sıralaması/);
  assert.match(finished,/🥇 Ali/);
  for(const html of [registration,running,finished])assert.doesNotMatch(html,/ödül|hediye|atkı|forması|teslim|\bTL\b/i);
});

test('chat routes, UI, handlers and database/realtime operations are absent',async()=>{
  const html=await read('index.html');
  assert.doesNotMatch(html,/chat|Sohbet|PrizeAnnouncement/);
  const nav=await moduleApi('screen-navigation.js');
  assert.equal(nav.screenDefinition('chat'),null);
  const simple=await moduleApi('simple-navigation.js');
  assert.doesNotMatch(await read('simple-navigation.js'),/chat|Sohbet/);
  assert.ok(simple);
  const football=await read('football-center-bootstrap.js');
  assert.match(football,/anchor=document.getElementById\('rules'\)/);
  assert.match(football,/anchor.insertAdjacentHTML/);
  assert.doesNotMatch(football,/chat/);
});

test('static and late dynamic rules use one points-only ranking explanation',async()=>{
  const html=await read('index.html');
  assert.ok(html.includes(rankingRules));
  let updated='';
  const paragraph={textContent:'8. Sıralama 🏆',set innerHTML(value){updated=value}};
  vm.runInNewContext(await read('rules-ranking-update.js'),{document:{readyState:'complete',getElementById:()=>({querySelectorAll:()=>[paragraph]})}});
  assert.equal(updated,rankingRules);
  assert.match(html,/Sezu Puan Sıralaması/);
});

test('upstream policy drift fails the build rather than silently shipping forbidden content',()=>{
  assert.throws(()=>assertCleanSource('new-feature.js','Birinci 500 TL kazanır.'),/policy violation/);
  assert.throws(()=>assertCleanSource('new-feature.js',"sb.from('chat_messages')"),/policy violation/);
  assert.throws(()=>assertCleanSource('new-feature.js','https://example.org/team-logo.svg'),/policy violation/);
  assert.throws(()=>transformWebSource('index.html','<html></html>'),/needs review/);
});

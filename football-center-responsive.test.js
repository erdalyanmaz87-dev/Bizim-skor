const assert=require('assert');
const footballCenter=require('./football-center-bootstrap.js');
const footballCenterUtils=require('./football-center-utils.js');

const css=footballCenter.baseStyles?.()||'';

assert.match(css,/\.football-center-table-wrap\{[^}]*overflow-x:hidden/,'tablo yatay taşmayı kapatmalı');
assert.match(css,/\.football-center-table-wrap table\{[^}]*width:100%[^}]*min-width:0[^}]*table-layout:fixed/,'tablo telefon genişliğine sığmalı');
const mobileCss=css.slice(css.indexOf('@media(max-width:430px)'));
assert.match(mobileCss,/\.football-center-table-wrap th,[^}]*padding:8px 4px/,'mobilde hücreler sıkılaşmalı');

const standingsMarkup=footballCenterUtils.renderFootballCenterMarkup({
  category:'standings',
  updatedAt:'2026-09-05T08:57:00Z',
  items:[{rank:2,team:'Gençlerbirliği',played:3,goal_diff:2,points:7}]
});
assert.match(standingsMarkup,/<table class="football-center-standings">/,'puan durumu tablosu takım sütununa özel yerleşim kullanmalı');
assert.match(css,/\.football-center-standings th:nth-child\(2\),\.football-center-standings td:nth-child\(2\)\{[^}]*white-space:nowrap[^}]*overflow-wrap:normal/,'takım isimleri kelimenin ortasından bölünmemeli');
assert.match(css,/\.football-center-standings th:nth-child\(3\),\.football-center-standings td:nth-child\(3\)\{[^}]*width:32px/,'oynanan maç sütunu takım adına yer açmalı');

console.log('football center responsive table ok');

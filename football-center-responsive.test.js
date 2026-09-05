const assert=require('assert');
const footballCenter=require('./football-center-bootstrap.js');

const css=footballCenter.baseStyles?.()||'';

assert.match(css,/\.football-center-table-wrap\{[^}]*overflow-x:hidden/,'tablo yatay taşmayı kapatmalı');
assert.match(css,/\.football-center-table-wrap table\{[^}]*width:100%[^}]*min-width:0[^}]*table-layout:fixed/,'tablo telefon genişliğine sığmalı');
const mobileCss=css.slice(css.indexOf('@media(max-width:430px)'));
assert.match(mobileCss,/\.football-center-table-wrap th,[^}]*padding:8px 4px/,'mobilde hücreler sıkılaşmalı');

console.log('football center responsive table ok');

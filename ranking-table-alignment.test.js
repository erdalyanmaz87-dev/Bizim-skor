const fs=require('fs');
const assert=require('assert');
const loader=fs.readFileSync('ui-integration-loader.js','utf8');
const css=fs.existsSync('ranking-table-alignment.css')?fs.readFileSync('ranking-table-alignment.css','utf8'):'';
assert(loader.includes("loadStyle('ranking-table-alignment.css')"),'Ranking hizalama stili yüklenmeli');
assert(css.includes('td:nth-child(2)'),'Katılımcı sütunu ortak hizalanmalı');
assert(css.includes('text-align:left!important'),'Katılımcı isimleri sola hizalanmalı');
assert(css.includes('padding-left:20px!important'),'Sıra numarasından yeterli boşluk bırakılmalı');
console.log('ranking alignment contract ok');

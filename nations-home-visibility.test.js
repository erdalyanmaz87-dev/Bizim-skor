const assert=require('assert');
const fs=require('fs');
const source=fs.readFileSync(require.resolve('./nations-league-ui.js'),'utf8');

const loadMatch=source.match(/async function loadPrediction\([\s\S]*?(?=async function savePrediction)/);
assert.ok(loadMatch,'loadPrediction fonksiyonu bulunmalı');
assert.doesNotMatch(loadMatch[0],/openNationsPrediction/,'Sadece veri/tahmin yenilemek Uluslar Ligi ekranını zorla açmamalı');
assert.doesNotMatch(loadMatch[0],/nations-prediction-opened/,'Sadece veri/tahmin yenilemek ekran açıldı olayı yayınlamamalı');

const openMatch=source.match(/function openPrediction\([\s\S]*?(?=async function loadPrediction)/);
assert.ok(openMatch,'openPrediction fonksiyonu bulunmalı');
assert.match(openMatch[0],/openNationsPrediction/,'Uluslar Ligi ekranı yalnız açıkça openPrediction ile açılmalı');

console.log('nations home visibility guard ok');

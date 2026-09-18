const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('prediction-bottom-sheet.js','utf8');
assert(src.includes('#championsFixtures .champions-match'),'Şampiyonlar Ligi maçları ortak tahmin paneline bağlanmalı');
assert(src.includes('#nationsFixtures .nations-match'),'Uluslar Ligi maçları ortak tahmin paneline bağlanmalı');
assert(src.includes("'#championsSave'"),'Şampiyonlar Ligi panel kaydı kendi kaydet düğmesine yönlenmeli');
assert(src.includes("'#nationsSave'"),'Uluslar Ligi panel kaydı kendi kaydet düğmesine yönlenmeli');
assert(src.includes("input[id^=\"clh\"]")&&src.includes("input[id^=\"nlh\"]"),'Ortak panel CL ve Uluslar Ligi skor inputlarını okuyabilmeli');
console.log('competition prediction sheet contract ok');

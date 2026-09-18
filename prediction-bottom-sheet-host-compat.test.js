const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('prediction-bottom-sheet.js','utf8');
assert(!src.includes('<section class="bs-pred-sheet"'),'Tahmin paneli ana uygulamadaki section/tab gizleme davranışına takılmamalı');
assert(src.includes('<div class="bs-pred-sheet"'),'Tahmin paneli bağımsız bir div dialog kabuğu kullanmalı');
console.log('prediction bottom sheet host compatibility ok');

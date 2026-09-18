const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('prediction-bottom-sheet.js','utf8');
assert(!src.includes('<section class="bs-pred-sheet"'),'Tahmin paneli uygulamanın section görünürlük yöneticisine takılmamalı');
assert(src.includes('<div class="bs-pred-sheet"'),'Tahmin paneli bağımsız div dialog kabuğu kullanmalı');
assert(src.includes('role="dialog"'),'Tahmin paneli dialog semantiğini korumalı');
console.log('prediction bottom sheet structural host contract ok');

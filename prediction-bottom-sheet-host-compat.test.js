const fs=require('fs');
const assert=require('assert');
const fix=fs.readFileSync('prediction-bottom-sheet-visibility-fix.js','utf8');
const loader=fs.readFileSync('ui-integration-loader.js','utf8');
assert(fix.includes("panel.classList.remove('hide')"),'Tahmin paneline yanlışlıkla eklenen hide sınıfı temizlenmeli');
assert(fix.includes('#bsPredictionBottomSheet.open>.bs-pred-sheet.hide{display:block!important}'),'Açık tahmin paneli hide sınıfına rağmen görünür kalmalı');
assert(loader.includes("'prediction-bottom-sheet-visibility-fix.js'"),'Görünürlük düzeltmesi tahmin panelinden sonra yüklenmeli');
assert(loader.indexOf("'prediction-bottom-sheet.js'")<loader.indexOf("'prediction-bottom-sheet-visibility-fix.js'"),'Görünürlük düzeltmesi ana panelden sonra çalışmalı');
console.log('prediction bottom sheet host compatibility ok');

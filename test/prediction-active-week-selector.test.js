const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const patchPath=path.join(__dirname,'../prediction-active-week-selector.js');
const loader=fs.readFileSync(path.join(__dirname,'../ui-integration-loader.js'),'utf8');
const patch=fs.existsSync(patchPath)?fs.readFileSync(patchPath,'utf8'):'';

test('aktif hafta seçici yaması UI loader tarafından yüklenir',()=>{
  assert.match(loader,/prediction-active-week-selector\.js/);
});

test('Şampiyonlar Ligi ve Uluslar Ligi tahmin ekranlarına hafta seçici ekler',()=>{
  assert.match(patch,/championsPredictionWeekSelect/);
  assert.match(patch,/nationsPredictionWeekSelect/);
  assert.match(patch,/get_champions_league_available_weeks/);
  assert.match(patch,/get_nations_league_available_weeks/);
});

test('hafta seçici yalnız kilitlenmemiş tahmin haftalarını gösterir',()=>{
  assert.match(patch,/is_locked/);
  assert.match(patch,/Tahmine Açık/);
  assert.match(patch,/openWeeks/);
});

test('aynı anda iki açık hafta varsa ikisi de seçilebilir',()=>{
  assert.match(patch,/slice\(0,2\)/);
  assert.match(patch,/change/);
  assert.match(patch,/loadPrediction/);
});

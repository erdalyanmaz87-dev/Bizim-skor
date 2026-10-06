const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

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
  assert.match(patch,/BizimSkorNationsUI\.availableWeeks/);
});

test('hafta seçici en güncel iki tahmin haftasını sırayla gösterir',()=>{
  assert.match(patch,/is_locked/);
  assert.match(patch,/selectLatestWeeks/);
});

test('aynı anda iki açık hafta varsa ikisi de seçilebilir',()=>{
  assert.match(patch,/slice\(0,2\)/);
  assert.match(patch,/change/);
  assert.match(patch,/loadPrediction/);
});

test('Uluslar Ligi hafta seçici ortak önbellekli veri kaynağını kullanır',()=>{
  assert.match(patch,/BizimSkorNationsUI\.availableWeeks/);
  assert.match(patch,/BizimSkorNationsUI\.loadWeekRows/);
});

test('oturum seçici kurulduktan sonra hazır olursa Uluslar Ligi 5 ve 6. haftayı yeniden yükler',async()=>{
  let token='',availableCalls=0;
  const warnings=[];
  const select={dataset:{},innerHTML:'',disabled:false,value:'',addEventListener(){}};
  const host={id:'',className:'',set innerHTML(value){this._html=value},querySelector(){return select}};
  const hero={insertAdjacentElement(_where,element){context.document.picker=element}};
  const context={
    console:{...console,warn(...args){warnings.push(args)}},
    setTimeout(){return 0},
    MutationObserver:class{observe(){}},
    localStorage:{getItem(){return token}},
    addEventListener(){},
    document:{
      readyState:'complete',
      picker:null,
      body:{},
      head:{insertAdjacentHTML(){}},
      createElement(){return host},
      getElementById(id){
        if(id==='nationsPred')return {};
        if(id==='nationsPredictionWeekPicker')return this.picker;
        return null;
      },
      querySelector(selector){return selector==='#nationsPred .nations-hero'?hero:null}
    },
    BizimSkorNationsUI:{
      async availableWeeks(){availableCalls++;return[1,2,3,4,5,6]},
      async loadWeekRows(week){return[{week,is_locked:false}]},
      async loadPrediction(){}
    },
    BizimSkorTwoWeek:{selectLatestWeeks(checks){return checks.map(item=>item.week).slice(-2)}}
  };
  context.globalThis=context;
  vm.runInNewContext(patch,context);
  await new Promise(setImmediate);
  assert.match(select.innerHTML,/açık hafta yok/i);
  assert.equal(select.dataset.bound,'');

  token='friend-token';
  context.BizimSkorActivePredictionWeekSelector.refresh();
  await new Promise(setImmediate);

  assert.equal(availableCalls,1);
  assert.deepEqual(warnings,[]);
  assert.equal(select.dataset.bound,'1');
  assert.match(select.innerHTML,/value="5"/);
  assert.match(select.innerHTML,/value="6"/);
  assert.equal(select.disabled,false);
});

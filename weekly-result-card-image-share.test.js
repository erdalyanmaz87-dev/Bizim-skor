const test=require('node:test');
const assert=require('node:assert/strict');
const Share=require('./weekly-result-card-image-share');

const model={
  player:'Erdal',week:3,points:3,exact:0,correct:3,weeklyRank:9,overallRank:17,
  movement:{direction:'down',value:11,label:'▼ 11'},
  inviteUrl:'https://bizim-skor-live.vercel.app/?invite=Erdal'
};

test('buildCardSvg creates a shareable premium weekly-result visual',()=>{
  const svg=Share.buildCardSvg(model);
  assert.match(svg,/1080/);
  assert.match(svg,/1350/);
  assert.match(svg,/Erdal/);
  assert.match(svg,/3\. HAFTA/);
  assert.match(svg,/TOPLAM PUAN/);
  assert.match(svg,/>3</);
  assert.match(svg,/TAM SKOR/);
  assert.match(svg,/DOĞRU SONUÇ/);
  assert.match(svg,/#9/);
  assert.match(svg,/#17/);
  assert.match(svg,/bizim-skor-live\.vercel\.app/);
});

test('buildNativeSharePayload includes PNG file and clickable invite link text',()=>{
  const file={name:'bizim-skor-3-hafta-erdal.png',type:'image/png'};
  const payload=Share.buildNativeSharePayload(model,file);
  assert.deepEqual(payload.files,[file]);
  assert.match(payload.text,/bizim-skor-live\.vercel\.app\/\?invite=Erdal/);
  assert.equal(payload.title,'Bizim Skor • Haftalık Sonucum');
});

test('sharePreparedFile uses native file sharing when supported',async()=>{
  const file={name:'bizim-skor-3-hafta-erdal.png',type:'image/png'};
  let shared=null;
  const host={navigator:{canShare:({files})=>files?.[0]===file,share:async payload=>{shared=payload}}};
  const result=await Share.sharePreparedFile(model,file,host);
  assert.equal(result,true);
  assert.deepEqual(shared.files,[file]);
  assert.match(shared.text,/invite=Erdal/);
});

const assert=require('assert');
const fs=require('fs');

assert.ok(fs.existsSync('./share-game.js'),'WhatsApp paylaşım bileşeni bulunmalı');

const share=require('./share-game.js');
const gameUrl='https://bizim-skor-live.vercel.app';
const text=share.shareText(gameUrl);
assert.ok(text.includes('Bizim Skor\u2019a sen de katıl'));
assert.ok(text.includes(gameUrl));
assert.strictEqual(
  share.whatsappUrl(gameUrl),
  'https://wa.me/?text='+encodeURIComponent(text)
);

let insertedPosition='';
let insertedElement=null;
let insertedStyle='';
const tabs={insertAdjacentElement(position,element){insertedPosition=position;insertedElement=element}};
const documentStub={
  getElementById(){return null},
  querySelector(selector){return selector==='.tabs'?tabs:null},
  createElement(tag){return{tagName:tag.toUpperCase(),className:'',textContent:'',set id(value){this._id=value},get id(){return this._id},set href(value){this._href=value},get href(){return this._href}}},
  head:{insertAdjacentHTML(position,html){insertedStyle=html}}
};

assert.strictEqual(share.mount(documentStub,{location:{origin:gameUrl,pathname:'/'}}),true);
assert.strictEqual(insertedPosition,'afterend');
assert.strictEqual(insertedElement.id,'bsShareGame');
assert.strictEqual(insertedElement.textContent,'🟢 Oyunu Arkadaşına Öner');
assert.strictEqual(insertedElement.href,share.whatsappUrl(gameUrl+'/'));
assert.ok(insertedStyle.includes('bsShareGameStyles'));
console.log('share game ok');

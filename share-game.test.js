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

let wrapperPosition='';
let wrapperElement=null;
let insertedStyle='';
let clickHandler=null;
const connection={insertAdjacentElement(position,element){wrapperPosition=position;wrapperElement=element}};
const oldTabs={insertAdjacentElement(position,element){wrapperPosition=position;wrapperElement=element}};
const documentStub={
  getElementById(id){return id==='conn'?connection:null},
  querySelector(selector){return selector==='.tabs'?oldTabs:null},
  createElement(tag){return{tagName:tag.toUpperCase(),className:'',textContent:'',children:[],appendChild(child){this.children.push(child)},addEventListener(type,handler){if(type==='click')clickHandler=handler},set id(value){this._id=value},get id(){return this._id},set href(value){this._href=value},get href(){return this._href}}},
  head:{insertAdjacentHTML(position,html){insertedStyle=html}}
};

assert.strictEqual(share.mount(documentStub,{location:{origin:gameUrl,pathname:'/'}}),true);
assert.strictEqual(wrapperPosition,'beforebegin');
assert.strictEqual(wrapperElement.id,'bsConnectionShareRow');
assert.strictEqual(wrapperElement.children[0],connection);
assert.strictEqual(wrapperElement.children[1].id,'bsShareGame');
assert.strictEqual(wrapperElement.children[1].textContent,'🟢 Oyunu Arkadaşına Öner');
assert.strictEqual(wrapperElement.children[1].href,share.whatsappUrl(gameUrl+'/'));
assert.ok(insertedStyle.includes('bsShareGameStyles'));

let rpcCall=null;
const host={
  location:{origin:gameUrl,pathname:'/'},
  localStorage:{getItem(key){return key==='bizimSkorFriendToken'?'valid-session-token':null}},
  sb:{rpc(name,args){rpcCall={name,args};return Promise.resolve({error:null})}}
};
clickHandler=null;
assert.strictEqual(share.mount({...documentStub,getElementById(id){return id==='conn'?connection:null}},host),true);
assert.equal(typeof clickHandler,'function');
clickHandler();
assert.deepStrictEqual(rpcCall,{name:'record_game_share_click',args:{p_token:'valid-session-token',p_channel:'whatsapp'}});

rpcCall=null;
assert.strictEqual(share.recordShareClick({localStorage:{getItem(){return''}},sb:host.sb}),false);
assert.strictEqual(rpcCall,null);
console.log('share game ok');

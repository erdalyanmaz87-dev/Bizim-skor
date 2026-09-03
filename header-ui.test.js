const assert=require('assert');
const ui=require('./header-ui.js');
assert.deepStrictEqual(ui.headerAccountState('Erdal'),{loggedIn:true,name:'Erdal',action:'Çıkış Yap'});
assert.deepStrictEqual(ui.headerAccountState(''),{loggedIn:false,name:'',action:'Giriş Yap'});
console.log('header-ui ok');

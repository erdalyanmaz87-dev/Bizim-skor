(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorHeaderUI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function headerAccountState(name){
    const clean=String(name||'').trim();
    return clean
      ? {loggedIn:true,name:clean,action:'Çıkış Yap'}
      : {loggedIn:false,name:'',action:'Giriş Yap'};
  }
  return Object.freeze({headerAccountState});
});

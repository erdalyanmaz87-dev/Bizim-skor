(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorLaunch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function detectLaunchContext(input){
    const ua=String(input.userAgent||'');
    const platform=/iPhone|iPad|iPod/i.test(ua)?'iPhone':/Android/i.test(ua)?'Android':/Windows/i.test(ua)?'Windows':/Macintosh|Mac OS/i.test(ua)?'Mac':'Diğer';
    return{
      launchMode:input.standalone===true||input.displayStandalone===true?'home_screen':'browser',
      platform
    };
  }
  return{detectLaunchContext};
});

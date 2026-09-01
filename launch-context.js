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
  if(typeof document!=='undefined'){
    const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
    load('push-notifications-core.js').then(()=>load('push-notifications.js')).catch(error=>console.warn('push bootstrap',error));
  }
  return{detectLaunchContext};
});

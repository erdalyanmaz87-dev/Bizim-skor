(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorPushCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function shouldPrompt(input){
    return input.permission==='default' && Number(input.attempts||0)<3 && input.enabled!==true;
  }
  function nextAttemptCount(value){
    return Math.min(3,Number(value||0)+1);
  }
  function urlBase64ToUint8Array(base64String){
    const padding='='.repeat((4-base64String.length%4)%4);
    const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
    const raw=typeof atob==='function'?atob(base64):Buffer.from(base64,'base64').toString('binary');
    const output=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)output[i]=raw.charCodeAt(i);
    return output;
  }
  function applicationServerKeyMatches(actual,expected){
    if(!actual||!expected)return false;
    const left=new Uint8Array(actual),right=new Uint8Array(expected);
    if(left.length!==right.length)return false;
    for(let i=0;i<left.length;i++)if(left[i]!==right[i])return false;
    return true;
  }
  return{shouldPrompt,nextAttemptCount,urlBase64ToUint8Array,applicationServerKeyMatches};
});
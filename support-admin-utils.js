(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorSupportAdmin=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const STATUSES=new Set(['new','answered','resolved']);
  function validateAdminReply(reply){
    const clean=String(reply||'').trim();
    if(!clean)return{ok:false,message:'Cevabınızı yazın.'};
    if(clean.length>1000)return{ok:false,message:'Cevap en fazla 1000 karakter olabilir.'};
    return{ok:true,reply:clean};
  }
  function normalizeSupportStatus(status){
    const clean=String(status||'').trim().toLowerCase();
    return STATUSES.has(clean)?clean:null;
  }
  return Object.freeze({STATUSES,validateAdminReply,normalizeSupportStatus});
});

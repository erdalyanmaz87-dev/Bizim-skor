(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorSupportInbox=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const CATEGORIES=new Set(['login_pin','predictions','points_ranking','technical','suggestion','other']);
  function normalizeSupportCategory(value){return String(value||'').trim().toLowerCase()}
  function validateSupportMessage({category,message}={}){
    const cleanCategory=normalizeSupportCategory(category),cleanMessage=String(message||'').trim();
    if(!CATEGORIES.has(cleanCategory))return{ok:false,message:'Geçerli bir kategori seçin.'};
    if(!cleanMessage)return{ok:false,message:'Mesajınızı yazın.'};
    if(cleanMessage.length>500)return{ok:false,message:'Mesaj en fazla 500 karakter olabilir.'};
    return{ok:true,category:cleanCategory,message:cleanMessage};
  }
  function hasUnreadAdminReply(row){return Boolean(row?.admin_reply&&row?.answered_at&&!row?.player_seen_reply_at)}
  return Object.freeze({CATEGORIES,normalizeSupportCategory,validateSupportMessage,hasUnreadAdminReply});
});

function createCaller({getToken,rpc,tokenField}){
  if(typeof getToken!=='function'||typeof rpc!=='function')throw new Error('support transport required');
  return async function call(name,args={}){
    const token=String(getToken()||'');
    if(!token)throw new Error('Oturum gerekli');
    const result=await rpc(name,{[tokenField]:token,...args});
    if(result?.error)throw new Error(result.error.message||String(result.error));
    return result?.data;
  };
}
function createPlayerSupportApi({getToken,rpc}={}){
  const call=createCaller({getToken,rpc,tokenField:'p_token'});
  return Object.freeze({
    list:()=>call('list_my_support_requests'),
    create:(category,message)=>call('create_support_request',{p_category:category,p_message:message}),
    markSeen:id=>call('mark_support_reply_seen',{p_request_id:id})
  });
}
function createAdminSupportApi({getToken,rpc}={}){
  const call=createCaller({getToken,rpc,tokenField:'p_admin_token'});
  return Object.freeze({
    isAdmin:()=>call('is_support_admin'),
    list:status=>call('list_support_requests',{p_status:status??null}),
    reply:(id,reply)=>call('reply_support_request',{p_request_id:id,p_reply:reply}),
    resolve:id=>call('resolve_support_request',{p_request_id:id})
  });
}
if(typeof module==='object'&&module.exports)module.exports={createPlayerSupportApi,createAdminSupportApi};
else globalThis.BizimSkorSupportApi={createPlayerSupportApi,createAdminSupportApi};

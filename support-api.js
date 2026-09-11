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
function createAnonymousSupportApi({getUserId,getGuestName,invoke,ensureSession}={}){
  if(typeof getUserId!=='function'||typeof getGuestName!=='function'||typeof invoke!=='function')throw new Error('anonymous support transport required');
  async function ready(){
    if(String(getUserId()||''))return;
    if(typeof ensureSession==='function')await ensureSession();
    if(!String(getUserId()||''))throw new Error('Anonim oturum gerekli');
  }
  async function call(action,body={}){
    await ready();
    const result=await invoke('support-inbox',{body:{action,...body}});
    if(result?.error)throw new Error(result.error.message||String(result.error));
    if(result?.data?.ok===false)throw new Error(result.data.error||'Destek işlemi başarısız');
    return result?.data?.data;
  }
  return Object.freeze({
    list:()=>call('anonymous_list'),
    create:(category,message)=>call('anonymous_create',{name:String(getGuestName()||''),category,message}),
    markSeen:id=>call('anonymous_seen',{request_id:id})
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
if(typeof module==='object'&&module.exports)module.exports={createPlayerSupportApi,createAnonymousSupportApi,createAdminSupportApi};
else globalThis.BizimSkorSupportApi={createPlayerSupportApi,createAnonymousSupportApi,createAdminSupportApi};

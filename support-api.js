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
function createGuestSupportApi({getGuestToken,getGuestName,invoke,ensureGuestToken}={}){
  if(typeof getGuestToken!=='function'||typeof getGuestName!=='function'||typeof invoke!=='function')throw new Error('guest support transport required');
  async function ready(){
    if(String(getGuestToken()||''))return;
    if(typeof ensureGuestToken==='function')await ensureGuestToken();
    if(!String(getGuestToken()||''))throw new Error('Destek anahtarı oluşturulamadı');
  }
  async function call(action,body={}){
    await ready();
    const guest_token=String(getGuestToken()||'');
    const result=await invoke('support-inbox',{body:{action,guest_token,...body}});
    if(result?.error)throw new Error(result.error.message||String(result.error));
    if(result?.data?.ok===false)throw new Error(result.data.error||'Destek işlemi başarısız');
    return result?.data?.data;
  }
  return Object.freeze({
    list:()=>call('guest_list'),
    create:(category,message)=>call('guest_create',{name:String(getGuestName()||''),category,message}),
    markSeen:id=>call('guest_seen',{request_id:id})
  });
}
function createAdminSupportApi({getToken,rpc}={}){
  const adminCall=createCaller({getToken,rpc,tokenField:'p_admin_token'});
  const authCall=createCaller({getToken,rpc,tokenField:'p_token'});
  return Object.freeze({
    isAdmin:()=>authCall('is_support_admin'),
    list:status=>adminCall('list_support_requests',{p_status:status??null}),
    reply:(id,reply)=>adminCall('reply_support_request',{p_request_id:id,p_reply:reply}),
    resolve:id=>adminCall('resolve_support_request',{p_request_id:id})
  });
}
if(typeof module==='object'&&module.exports)module.exports={createPlayerSupportApi,createGuestSupportApi,createAdminSupportApi};
else globalThis.BizimSkorSupportApi={createPlayerSupportApi,createGuestSupportApi,createAdminSupportApi};

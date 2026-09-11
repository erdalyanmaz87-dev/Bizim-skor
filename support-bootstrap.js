function createSupportBootstrap(root=globalThis){
  function token(){return String(root?.localStorage?.getItem?.('bizimSkorFriendToken')||'')}
  function rpc(name,args){return root.sb.rpc(name,args)}
  async function mount(doc=root.document){
    if(!root?.sb?.rpc)return{mounted:false,reason:'no-rpc'};
    const required=['BizimSkorSupportApi','BizimSkorSupportInbox','BizimSkorSupportAdmin','BizimSkorSupportPlayerController','BizimSkorSupportAdminController','BizimSkorSupportPlayerView','BizimSkorSupportAdminView','BizimSkorSupportPlacement','BizimSkorSupportAdminPlacement','BizimSkorSupportPlayerUI','BizimSkorSupportAdminUI'];
    if(required.some(key=>!root[key]))return{mounted:false,reason:'missing-module'};

    if(token()){
      const playerApi=root.BizimSkorSupportApi.createPlayerSupportApi({getToken:token,rpc});
      const adminApi=root.BizimSkorSupportApi.createAdminSupportApi({getToken:token,rpc});
      const playerController=root.BizimSkorSupportPlayerController.createPlayerSupportController({api:playerApi,validate:root.BizimSkorSupportInbox.validateSupportMessage,isUnread:root.BizimSkorSupportInbox.hasUnreadAdminReply});
      const adminController=root.BizimSkorSupportAdminController.createSupportAdminController({api:adminApi,validateReply:root.BizimSkorSupportAdmin.validateAdminReply,normalizeStatus:root.BizimSkorSupportAdmin.normalizeSupportStatus});
      const playerUI=root.BizimSkorSupportPlayerUI.createPlayerSupportUI({doc,view:root.BizimSkorSupportPlayerView,controller:playerController,placement:root.BizimSkorSupportPlacement,isUnread:root.BizimSkorSupportInbox.hasUnreadAdminReply});
      const adminUI=root.BizimSkorSupportAdminUI.createAdminSupportUI({doc,view:root.BizimSkorSupportAdminView,controller:adminController,adminApi,placement:root.BizimSkorSupportAdminPlacement});
      await playerUI.refresh();
      await adminUI.refreshButton();
      return{mounted:true,mode:'player',playerUI,adminUI};
    }

    if(!root?.sb?.auth?.getSession||!root?.sb?.auth?.signInAnonymously||!root?.sb?.functions?.invoke)return{mounted:false,reason:'no-anonymous-transport'};
    let anonymousUserId='';
    async function ensureAnonymousSession(){
      const current=await root.sb.auth.getSession();
      if(current?.error)throw current.error;
      let session=current?.data?.session||null;
      if(session?.user?.is_anonymous===true){anonymousUserId=String(session.user.id||'');return session}
      if(session?.user)throw new Error('Anonim destek oturumu açılamadı');
      const created=await root.sb.auth.signInAnonymously();
      if(created?.error)throw created.error;
      session=created?.data?.session||null;
      if(!session?.user?.id)throw new Error('Anonim destek oturumu açılamadı');
      anonymousUserId=String(session.user.id);
      return session;
    }
    const getGuestName=()=>String(doc?.getElementById?.('supportGuestName')?.value||doc?.getElementById?.('loginName')?.value||'').trim();
    const anonymousApi=root.BizimSkorSupportApi.createAnonymousSupportApi({
      getUserId:()=>anonymousUserId,
      getGuestName,
      ensureSession:ensureAnonymousSession,
      invoke:(name,options)=>root.sb.functions.invoke(name,options)
    });
    const playerController=root.BizimSkorSupportPlayerController.createPlayerSupportController({api:anonymousApi,validate:root.BizimSkorSupportInbox.validateSupportMessage,isUnread:root.BizimSkorSupportInbox.hasUnreadAdminReply});
    const playerUI=root.BizimSkorSupportPlayerUI.createPlayerSupportUI({doc,view:root.BizimSkorSupportPlayerView,controller:playerController,placement:root.BizimSkorSupportPlacement,isUnread:root.BizimSkorSupportInbox.hasUnreadAdminReply,lazy:true,anonymous:true});
    await playerUI.refresh();
    return{mounted:true,mode:'anonymous',playerUI};
  }
  return Object.freeze({mount});
}
if(typeof module==='object'&&module.exports)module.exports={createSupportBootstrap};
else globalThis.BizimSkorSupportBootstrap={createSupportBootstrap};

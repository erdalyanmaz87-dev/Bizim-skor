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

    if(!root?.sb?.functions?.invoke||!root?.localStorage?.getItem||!root?.localStorage?.setItem||!root?.crypto?.getRandomValues)return{mounted:false,reason:'no-guest-transport'};
    const guestKey='bizimSkorSupportGuestToken';
    function getGuestToken(){return String(root.localStorage.getItem(guestKey)||'')}
    async function ensureGuestToken(){
      const existing=getGuestToken();
      if(existing)return existing;
      const bytes=new Uint8Array(32);
      root.crypto.getRandomValues(bytes);
      const value=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
      root.localStorage.setItem(guestKey,value);
      return value;
    }
    const getGuestName=()=>String(doc?.getElementById?.('supportGuestName')?.value||doc?.getElementById?.('loginName')?.value||'').trim();
    const guestApi=root.BizimSkorSupportApi.createGuestSupportApi({
      getGuestToken,
      getGuestName,
      ensureGuestToken,
      invoke:(name,options)=>root.sb.functions.invoke(name,options)
    });
    const playerController=root.BizimSkorSupportPlayerController.createPlayerSupportController({api:guestApi,validate:root.BizimSkorSupportInbox.validateSupportMessage,isUnread:root.BizimSkorSupportInbox.hasUnreadAdminReply});
    const playerUI=root.BizimSkorSupportPlayerUI.createPlayerSupportUI({doc,view:root.BizimSkorSupportPlayerView,controller:playerController,placement:root.BizimSkorSupportPlacement,isUnread:root.BizimSkorSupportInbox.hasUnreadAdminReply,lazy:!getGuestToken(),anonymous:true});
    await playerUI.refresh();
    return{mounted:true,mode:'guest',playerUI};
  }
  return Object.freeze({mount});
}
if(typeof module==='object'&&module.exports)module.exports={createSupportBootstrap};
else globalThis.BizimSkorSupportBootstrap={createSupportBootstrap};

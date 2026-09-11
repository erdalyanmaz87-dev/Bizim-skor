function createSupportBootstrap(root=globalThis){
  function token(){return String(root?.localStorage?.getItem?.('bizimSkorFriendToken')||'')}
  function rpc(name,args){return root.sb.rpc(name,args)}
  async function mount(doc=root.document){
    if(!token())return{mounted:false,reason:'no-session'};
    if(!root?.sb?.rpc)return{mounted:false,reason:'no-rpc'};
    const required=['BizimSkorSupportApi','BizimSkorSupportInbox','BizimSkorSupportAdmin','BizimSkorSupportPlayerController','BizimSkorSupportAdminController','BizimSkorSupportPlayerView','BizimSkorSupportAdminView','BizimSkorSupportPlacement','BizimSkorSupportAdminPlacement','BizimSkorSupportPlayerUI','BizimSkorSupportAdminUI'];
    if(required.some(key=>!root[key]))return{mounted:false,reason:'missing-module'};
    const playerApi=root.BizimSkorSupportApi.createPlayerSupportApi({getToken:token,rpc});
    const adminApi=root.BizimSkorSupportApi.createAdminSupportApi({getToken:token,rpc});
    const playerController=root.BizimSkorSupportPlayerController.createPlayerSupportController({api:playerApi,validate:root.BizimSkorSupportInbox.validateSupportMessage,isUnread:root.BizimSkorSupportInbox.hasUnreadAdminReply});
    const adminController=root.BizimSkorSupportAdminController.createSupportAdminController({api:adminApi,validateReply:root.BizimSkorSupportAdmin.validateAdminReply,normalizeStatus:root.BizimSkorSupportAdmin.normalizeSupportStatus});
    const playerUI=root.BizimSkorSupportPlayerUI.createPlayerSupportUI({doc,view:root.BizimSkorSupportPlayerView,controller:playerController,placement:root.BizimSkorSupportPlacement,isUnread:root.BizimSkorSupportInbox.hasUnreadAdminReply});
    const adminUI=root.BizimSkorSupportAdminUI.createAdminSupportUI({doc,view:root.BizimSkorSupportAdminView,controller:adminController,adminApi,placement:root.BizimSkorSupportAdminPlacement});
    await playerUI.refresh();
    await adminUI.refreshButton();
    return{mounted:true,playerUI,adminUI};
  }
  return Object.freeze({mount});
}
if(typeof module==='object'&&module.exports)module.exports={createSupportBootstrap};
else globalThis.BizimSkorSupportBootstrap={createSupportBootstrap};

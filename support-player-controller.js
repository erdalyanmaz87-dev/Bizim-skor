function createPlayerSupportController({api,validate,isUnread}={}){
  if(!api||typeof api.list!=='function')throw new Error('support api required');
  const safeUnread=typeof isUnread==='function'?isUnread:()=>false;
  async function load(){
    const rows=await api.list();
    const safeRows=Array.isArray(rows)?rows:[];
    return{rows:safeRows,unread:safeRows.filter(safeUnread).length};
  }
  async function send(category,message){
    const checked=typeof validate==='function'?validate({category,message}):{ok:true,category,message};
    if(!checked?.ok)return{ok:false,error:checked?.message||'Mesaj gönderilemedi'};
    await api.create(checked.category,checked.message);
    const state=await load();
    return{ok:true,...state};
  }
  async function markSeen(id){
    const requestId=Number(id);
    if(!Number.isInteger(requestId)||requestId<=0||typeof api.markSeen!=='function')return{ok:false};
    const ok=await api.markSeen(requestId);
    return{ok:Boolean(ok)};
  }
  return Object.freeze({load,send,markSeen});
}
if(typeof module==='object'&&module.exports)module.exports={createPlayerSupportController};
else globalThis.BizimSkorSupportPlayerController={createPlayerSupportController};

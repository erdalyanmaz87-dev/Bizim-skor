function createSupportAdminController({api,validateReply,normalizeStatus}={}){
  if(!api||typeof api.list!=='function')throw new Error('admin support api required');
  const normalize=typeof normalizeStatus==='function'?normalizeStatus:v=>v;
  async function load(status='new'){
    const normalized=status==='all'?null:normalize(status);
    const rows=await api.list(normalized);
    return{rows:Array.isArray(rows)?rows:[],status:status==='all'?'all':(normalized||'new')};
  }
  async function reply(id,text,status='new'){
    const requestId=Number(id);
    if(!Number.isInteger(requestId)||requestId<=0||typeof api.reply!=='function')return{ok:false};
    const checked=typeof validateReply==='function'?validateReply(text):{ok:true,reply:String(text||'').trim()};
    if(!checked?.ok)return{ok:false,error:checked?.message||'Cevap kaydedilemedi'};
    await api.reply(requestId,checked.reply);
    const state=await load(status);
    return{ok:true,...state};
  }
  async function resolve(id,status='new'){
    const requestId=Number(id);
    if(!Number.isInteger(requestId)||requestId<=0||typeof api.resolve!=='function')return{ok:false};
    await api.resolve(requestId);
    const state=await load(status);
    return{ok:true,...state};
  }
  return Object.freeze({load,reply,resolve});
}
if(typeof module==='object'&&module.exports)module.exports={createSupportAdminController};
else globalThis.BizimSkorSupportAdminController={createSupportAdminController};

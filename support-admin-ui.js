function defaultMakeElement(doc,html){
  const holder=doc.createElement('div');holder.innerHTML=String(html||'').trim();return holder.firstElementChild;
}
function createAdminSupportUI({doc,view,controller,adminApi,placement,makeElement}={}){
  if(!doc||!view||!controller||!adminApi||!placement)throw new Error('admin support ui dependencies required');
  const make=typeof makeElement==='function'?makeElement:html=>defaultMakeElement(doc,html);let overlay=null;
  function bindButton(button){if(!button||button._supportBound)return button;button._supportBound=true;button.addEventListener('click',()=>open('new').catch(()=>{}));return button}
  async function refreshButton(){
    const allowed=await adminApi.isAdmin();let existing=doc.getElementById?.('openSupportAdmin');
    if(!allowed){existing?.remove?.();return{admin:false,rows:[]}}
    if(!existing){const initial=make(view.inboxButton(0));if(initial){bindButton(initial);placement.insertAdminSupportButton(doc,initial);existing=initial}}
    const state=await controller.load('new'),fresh=make(view.inboxButton(state.rows.length));
    if(existing){existing.innerHTML=fresh?.innerHTML??existing.innerHTML;bindButton(existing)}
    return{admin:true,...state};
  }
  function ensureOverlay(){
    if(overlay?.isConnected)return overlay;overlay=doc.getElementById?.('supportAdminModal');if(overlay)return overlay;
    overlay=doc.createElement('div');overlay.id='supportAdminModal';overlay.className='support-modal hide';doc.body.appendChild(overlay);return overlay;
  }
  function close(){ensureOverlay().classList.add('hide')}
  function showStatus(shell,text){
    let node=shell.querySelector?.('#supportAdminStatus');
    if(!node){node=doc.createElement('div');node.id='supportAdminStatus';node.className='small';shell.querySelector?.('.support-admin-panel')?.prepend(node)}
    if(node)node.textContent=String(text||'');
  }
  async function render(rows,status){
    const shell=ensureOverlay();shell.innerHTML=`<div class="support-modal-backdrop" data-support-admin-close></div><div class="support-modal-card">${view.panel(rows,status)}</div>`;shell.classList.remove('hide');
    shell.querySelectorAll?.('[data-support-admin-close]').forEach(node=>node.addEventListener('click',close));
    shell.querySelectorAll?.('[data-support-filter]').forEach(node=>node.addEventListener('click',()=>open(node.dataset.supportFilter).catch(error=>showStatus(shell,error?.message||'Liste yüklenemedi'))));
    shell.querySelectorAll?.('[data-support-reply-send]').forEach(node=>node.addEventListener('click',async()=>{
      const card=node.closest?.('[data-request-id]'),id=card?.dataset?.requestId,text=card?.querySelector?.('[data-support-reply]')?.value||'';node.disabled=true;
      try{const result=await controller.reply(id,text,status);if(!result.ok){showStatus(shell,result.error||'Cevap kaydedilemedi');return}await render(result.rows||[],result.status||status);await refreshButton()}
      catch(error){showStatus(shell,error?.message||'Cevap kaydedilemedi')}finally{if(node.isConnected)node.disabled=false}
    }));
    shell.querySelectorAll?.('[data-support-resolve]').forEach(node=>node.addEventListener('click',async()=>{
      const card=node.closest?.('[data-request-id]'),id=card?.dataset?.requestId;node.disabled=true;
      try{const result=await controller.resolve(id,status);if(!result.ok){showStatus(shell,'İşlem tamamlanamadı');return}await render(result.rows||[],result.status||status);await refreshButton()}
      catch(error){showStatus(shell,error?.message||'İşlem tamamlanamadı')}finally{if(node.isConnected)node.disabled=false}
    }));
    return shell;
  }
  async function open(status='new'){const state=await controller.load(status);await render(state.rows||[],state.status||status);return state}
  return Object.freeze({refreshButton,open,close,render});
}
if(typeof module==='object'&&module.exports)module.exports={createAdminSupportUI};
else globalThis.BizimSkorSupportAdminUI={createAdminSupportUI};

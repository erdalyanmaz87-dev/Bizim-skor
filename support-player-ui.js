function defaultMakeElement(doc,html){
  const holder=doc.createElement('div');
  holder.innerHTML=String(html||'').trim();
  return holder.firstElementChild;
}
function createPlayerSupportUI({doc,view,controller,placement,isUnread,makeElement,lazy=false,anonymous=false}={}){
  if(!doc||!view||!controller||!placement)throw new Error('player support ui dependencies required');
  const make=typeof makeElement==='function'?makeElement:html=>defaultMakeElement(doc,html);
  const unreadCheck=typeof isUnread==='function'?isUnread:()=>false;
  let overlay=null;
  function bindButton(button){
    if(!button||button._supportBound)return button;
    button._supportBound=true;
    button.addEventListener('click',()=>open().catch(()=>{}));
    return button;
  }
  async function refresh(){
    const state=lazy?{rows:[],unread:0}:await controller.load();
    const fresh=make(view.supportButton(state.unread));
    const existing=doc.getElementById?.('openSupportInbox');
    if(existing){existing.innerHTML=fresh?.innerHTML??existing.innerHTML;bindButton(existing)}
    else if(fresh){bindButton(fresh);placement.insertPlayerSupportButton(doc,fresh)}
    return state;
  }
  function ensureOverlay(){
    if(overlay?.isConnected)return overlay;
    overlay=doc.getElementById?.('supportPlayerModal');
    if(overlay)return overlay;
    overlay=doc.createElement('div');overlay.id='supportPlayerModal';overlay.className='support-modal hide';doc.body.appendChild(overlay);return overlay;
  }
  function close(){ensureOverlay().classList.add('hide')}
  function showStatus(shell,text){
    let node=shell.querySelector?.('#supportFormStatus');
    if(!node){node=doc.createElement('div');node.id='supportFormStatus';node.className='small';shell.querySelector?.('#supportRequestForm')?.appendChild(node)}
    if(node)node.textContent=String(text||'');
  }
  async function render(rows){
    const shell=ensureOverlay();
    shell.innerHTML=`<div class="support-modal-backdrop" data-support-close></div><div class="support-modal-card">${view.panel(rows,{anonymous})}</div>`;
    shell.classList.remove('hide');
    shell.querySelectorAll?.('[data-support-close]').forEach(node=>node.addEventListener('click',close));
    const message=shell.querySelector?.('#supportMessage'),counter=shell.querySelector?.('#supportCounter');
    message?.addEventListener('input',()=>{if(counter)counter.textContent=String(message.value.length)});
    const form=shell.querySelector?.('#supportRequestForm');
    form?.addEventListener('submit',async event=>{
      event.preventDefault();
      if(anonymous){const guest=String(shell.querySelector?.('#supportGuestName')?.value||'').trim();if(guest.length<2){showStatus(shell,'Adını veya oyuncu adını yaz.');return}}
      const category=shell.querySelector?.('#supportCategory')?.value,text=message?.value||'',submit=form.querySelector?.('button[type="submit"]');
      if(submit)submit.disabled=true;
      try{const result=await controller.send(category,text);if(!result.ok){showStatus(shell,result.error||'Mesaj gönderilemedi');return}await render(result.rows||[]);if(!lazy)await refresh()}
      catch(error){showStatus(shell,error?.message||'Mesaj gönderilemedi')}
      finally{if(submit?.isConnected)submit.disabled=false}
    });
    return shell;
  }
  async function open(){
    const state=await controller.load();await render(state.rows||[]);
    const unseen=(state.rows||[]).filter(unreadCheck);
    if(unseen.length){await Promise.allSettled(unseen.map(row=>controller.markSeen(row.id)));if(!lazy)await refresh()}
    return state;
  }
  return Object.freeze({refresh,open,close,render});
}
if(typeof module==='object'&&module.exports)module.exports={createPlayerSupportUI};
else globalThis.BizimSkorSupportPlayerUI={createPlayerSupportUI};

(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorChatUnread=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const normalize=value=>String(value||'').trim().toLocaleLowerCase('tr-TR');
  function shouldMarkUnread({messagePlayer,currentPlayer,chatOpen}){
    if(chatOpen)return false;
    const mine=normalize(currentPlayer);
    return !mine||normalize(messagePlayer)!==mine;
  }
  function chatTab(){return document.querySelector('[data-tab="chat"]')}
  function chatIsOpen(){const section=document.getElementById('chat');return !!section&&!section.classList.contains('hide')}
  function clearUnread(){chatTab()?.classList.remove('has-unread')}
  function markUnread(){chatTab()?.classList.add('has-unread')}
  function handleInsert(payload){
    const messagePlayer=payload?.new?.player_name||'';
    const currentPlayer=root?.localStorage?.getItem('bizimSkorName')||'';
    if(shouldMarkUnread({messagePlayer,currentPlayer,chatOpen:chatIsOpen()}))markUnread();
  }
  function mount(){
    if(typeof document==='undefined')return;
    document.addEventListener('click',event=>{if(event.target?.closest?.('[data-tab="chat"]'))clearUnread()});
    if(root?.sb?.channel)root.sb.channel('chat-unread-ui').on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},handleInsert).subscribe();
  }
  return Object.freeze({shouldMarkUnread,handleInsert,clearUnread,markUnread,mount});
});

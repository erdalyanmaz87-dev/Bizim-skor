function isHidden(node){return !!node?.classList?.contains?.('hide')}
function findPlayerActionHost(doc){
  const newPlayer=doc?.getElementById?.('newPlayer');
  if(newPlayer&&!isHidden(newPlayer)){
    const login=doc?.getElementById?.('loginPlayer');
    if(login?.parentElement)return{host:login.parentElement,before:login.nextSibling||null};
  }
  const update=doc?.getElementById?.('updateProfile');
  if(update?.parentElement)return{host:update.parentElement,before:update.nextSibling||null};
  const forgot=doc?.getElementById?.('openPinReset');
  if(forgot?.parentElement)return{host:forgot.parentElement,before:forgot.nextSibling||null};
  return null;
}
function insertPlayerSupportButton(doc,button){
  const target=findPlayerActionHost(doc);
  if(!target||!button)return false;
  if(doc.getElementById?.('openSupportInbox'))return true;
  target.host.insertBefore(button,target.before);
  return true;
}
if(typeof module==='object'&&module.exports)module.exports={findPlayerActionHost,insertPlayerSupportButton};
else globalThis.BizimSkorSupportPlacement={findPlayerActionHost,insertPlayerSupportButton};

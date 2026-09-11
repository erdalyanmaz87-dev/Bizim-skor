function findPlayerActionHost(doc){
  const update=doc?.getElementById?.('updateProfile');
  if(!update?.parentElement)return null;
  return{host:update.parentElement,before:update.nextSibling||null};
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

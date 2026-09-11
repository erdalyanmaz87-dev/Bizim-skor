function findAdminSupportHost(doc){
  const livePanel=doc?.getElementById?.('adminLiveScorePanel');
  if(livePanel?.parentElement)return{host:livePanel.parentElement,after:livePanel};
  const daily=doc?.getElementById?.('dailyMatches');
  if(daily?.parentElement)return{host:daily.parentElement,before:daily};
  return null;
}
function insertAdminSupportButton(doc,container){
  if(!doc||!container)return false;
  if(doc.getElementById?.('supportAdminMount'))return true;
  const target=findAdminSupportHost(doc);
  if(!target)return false;
  container.id='supportAdminMount';
  if(target.after?.insertAdjacentElement){target.after.insertAdjacentElement('afterend',container);return true;}
  target.host.insertBefore(container,target.before||null);
  return true;
}
if(typeof module==='object'&&module.exports)module.exports={findAdminSupportHost,insertAdminSupportButton};
else globalThis.BizimSkorSupportAdminPlacement={findAdminSupportHost,insertAdminSupportButton};

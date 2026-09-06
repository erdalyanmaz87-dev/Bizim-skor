(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorLeagueInviteShare=api;api.start();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
function buildLeagueInviteUrl(baseUrl,inviter,leagueId,joinCode){
  if(!String(inviter||'').trim()||!String(joinCode||'').trim())return null;
  const url=new URL(baseUrl);url.searchParams.set('invite',String(inviter).trim());
  if(leagueId)url.searchParams.set('league',String(leagueId));
  url.searchParams.set('lig',String(joinCode).trim());return url.toString();
}
async function shareSelectedLeague(host=root,doc=typeof document!=='undefined'?document:null){
  const inviter=host?.localStorage?.getItem?.('bizimSkorName')||'';
  const leagueId=doc?.getElementById?.('friendLeagueSelect')?.value||'';
  const joinCode=doc?.getElementById?.('friendLeagueInviteCode')?.textContent?.trim()||'';
  const base=(host?.location?.origin||'')+(host?.location?.pathname||'/');
  const url=buildLeagueInviteUrl(base,inviter,leagueId,joinCode);if(!url)return false;
  const data={title:'Bizim Skor',text:'Bizim Skor arkadaş ligime katıl 👥',url};
  if(host?.navigator?.share){try{await host.navigator.share(data);return true}catch(e){if(e?.name==='AbortError')return false}}
  if(host?.navigator?.clipboard?.writeText){await host.navigator.clipboard.writeText(url);host.alert?.('Davet bağlantısı kopyalandı ✅');return true}
  host?.prompt?.('Davet bağlantısını kopyalayın:',url);return true;
}
function start(host=root,doc=typeof document!=='undefined'?document:null){
  if(!doc?.addEventListener)return false;
  doc.addEventListener('click',event=>{const target=event.target?.closest?.('#shareFriendLeague');if(!target)return;event.preventDefault();event.stopImmediatePropagation?.();shareSelectedLeague(host,doc).catch(e=>host.alert?.('Bağlantı paylaşılamadı: '+e.message));},true);return true;
}
return Object.freeze({buildLeagueInviteUrl,shareSelectedLeague,start});
});

(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorInviteRegistrationBootstrap=api;api.start();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
function normalized(value){return String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR')}
function readInvite(locationLike=root?.location){
  const params=new URLSearchParams(locationLike?.search||'');
  const inviterId=(params.get('invite')||'').trim();
  const leagueId=(params.get('league')||'').trim();
  return {inviterId:inviterId||null,leagueId:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(leagueId)?leagueId:null};
}
async function consumeRegistrationInvite({invite,token,newPlayerName,api}){
  const inviterId=String(invite?.inviterId||'').trim();
  if(!inviterId||!token)return {recorded:false,reason:'missing'};
  if(normalized(inviterId)===normalized(newPlayerName))return {recorded:false,reason:'self'};
  const q=await api.rpc('record_player_invite',{p_token:token,p_inviter_name:inviterId,p_league_id:invite?.leagueId||null});
  if(q?.error)throw q.error;
  return {recorded:q?.data===true,reason:q?.data===true?'recorded':'duplicate-or-invalid'};
}
function cleanInviteParams(host=root){
  if(!host?.history?.replaceState||!host?.location)return false;
  const url=new URL(host.location.href);
  url.searchParams.delete('invite');url.searchParams.delete('league');
  host.history.replaceState({},'',url.pathname+url.search+url.hash);return true;
}
function start(host=root,doc=typeof document!=='undefined'?document:null){
  if(!doc||!host?.addEventListener)return false;
  const invite=readInvite(host.location);if(!invite.inviterId)return false;
  let armed=false,done=false;
  const arm=()=>{armed=true};
  const button=doc.getElementById('createPlayer');
  if(button)button.addEventListener('click',arm,true);else doc.addEventListener('click',e=>{if(e.target?.id==='createPlayer')arm()},true);
  host.addEventListener('bizimskor:session-ready',async()=>{
    if(!armed||done)return;
    const token=host.localStorage?.getItem?.('bizimSkorFriendToken')||'';
    const name=host.localStorage?.getItem?.('bizimSkorName')||'';
    if(!token||!name)return;
    done=true;
    try{await consumeRegistrationInvite({invite,token,newPlayerName:name,api:host.sb});cleanInviteParams(host)}catch(error){done=false;console.warn('invite attribution skipped',error)}
  });
  return true;
}
return Object.freeze({normalized,readInvite,consumeRegistrationInvite,cleanInviteParams,start});
});

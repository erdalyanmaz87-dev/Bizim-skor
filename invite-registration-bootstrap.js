(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorInviteRegistrationBootstrap=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
function normalized(value){return String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR')}
async function consumeRegistrationInvite({invite,token,newPlayerName,api}){
  const inviterId=String(invite?.inviterId||'').trim();
  if(!inviterId||!token)return {recorded:false,reason:'missing'};
  if(normalized(inviterId)===normalized(newPlayerName))return {recorded:false,reason:'self'};
  const q=await api.rpc('record_player_invite',{p_token:token,p_inviter_name:inviterId,p_league_id:invite?.leagueId||null});
  if(q?.error)throw q.error;
  return {recorded:q?.data===true,reason:q?.data===true?'recorded':'duplicate-or-invalid'};
}
return Object.freeze({consumeRegistrationInvite});
});

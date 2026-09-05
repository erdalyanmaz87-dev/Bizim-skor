(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorGeneralRankingRefresh=api;api.mount()}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function mount(){
    if(!root.sb||root.__bizimSkorGeneralRankingRefresh)return false;
    root.BizimSkorOpportunityRanking?.mount?.();
    root.__bizimSkorGeneralRankingRefresh=root.sb.channel('general-rank-results-v2')
      .on('postgres_changes',{event:'*',schema:'public',table:'results'},()=>
        root.BizimSkorOpportunityRanking?.refreshAfterResult?.({
          document:root.document,
          loadGeneral:root.loadGeneral
        })
      ).subscribe();
    return true;
  }
  return Object.freeze({mount});
});

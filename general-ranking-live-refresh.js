(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorGeneralRankingRefresh=api;api.mount()}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function removeLeakedNewlineText(){
    const doc=root.document;
    if(!doc)return false;
    const walker=doc.createTreeWalker(doc.body,root.NodeFilter.SHOW_TEXT);
    const leaked=[];
    while(walker.nextNode()){
      if(walker.currentNode.nodeValue.trim()==='\\n')leaked.push(walker.currentNode);
    }
    leaked.forEach(node=>node.remove());
    return leaked.length>0;
  }
  function mount(){
    if(root.document){
      if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',removeLeakedNewlineText,{once:true});
      else removeLeakedNewlineText();
    }
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
  return Object.freeze({mount,removeLeakedNewlineText});
});

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorPredictionWeekLoadQueue=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function createSerialWeekLoader(loader){
    let tail=Promise.resolve();
    return function loadWeek(week,...args){
      const selected=Number(week);
      const run=()=>loader(selected,...args);
      const result=tail.then(run,run);
      tail=result.catch(()=>{});
      return result;
    };
  }
  return Object.freeze({createSerialWeekLoader});
});

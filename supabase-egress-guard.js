(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorSupabaseEgressGuard=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const CACHE_MS=5*60*1000;
  function cacheKey(name,args){return name+':'+JSON.stringify(args||{})}
  function install(client,nowFn){
    if(!client||typeof client.rpc!=='function'||client.__bizimSkorEgressGuard)return client;
    const now=typeof nowFn==='function'?nowFn:()=>Date.now(),original=client.rpc.bind(client),cache=new Map();
    client.rpc=function(name,args,options){
      if(name!=='get_robot_applied_fixture_ids')return original(name,args,options);
      const key=cacheKey(name,args),stamp=now(),hit=cache.get(key);
      if(hit&&stamp-hit.at<CACHE_MS)return hit.promise;
      const promise=Promise.resolve(original(name,args,options)).then(result=>{if(result?.error)cache.delete(key);return result}).catch(error=>{cache.delete(key);throw error});
      cache.set(key,{at:stamp,promise});
      return promise;
    };
    client.__bizimSkorEgressGuard={cache,originalRpc:original};
    return client;
  }
  function mount(){let tries=0;const run=()=>{if(root.sb){install(root.sb);return}if(tries++<40)setTimeout(run,100)};run()}
  return Object.freeze({CACHE_MS,cacheKey,install,mount});
});

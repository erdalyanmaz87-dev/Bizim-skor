(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorFixtureData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  async function fetchChampionsWeek(sb,token,season,week){
    if(!token)throw new Error('Önce oyuncu hesabına giriş yap.');
    const q=await sb.rpc('get_champions_league_week',{p_token:token,p_season:season,p_week:Number(week)});
    if(q.error)throw q.error;
    return (q.data||[]).map(row=>({...row,id:Number(row.fixture_id)}));
  }
  return{fetchChampionsWeek};
});
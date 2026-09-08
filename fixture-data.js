(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorFixtureData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function requireToken(token){if(!token)throw new Error('Önce oyuncu hesabına giriş yap.')}
  function mapRows(data){return (data||[]).map(row=>({...row,id:Number(row.fixture_id)}))}
  async function fetchChampionsWeek(sb,token,season,week){
    requireToken(token);
    const q=await sb.rpc('get_champions_league_week',{p_token:token,p_season:season,p_week:Number(week)});
    if(q.error)throw q.error;
    return mapRows(q.data);
  }
  async function fetchNationsWeek(sb,token,season,week){
    requireToken(token);
    const q=await sb.rpc('get_nations_league_week',{p_token:token,p_season:season,p_week:Number(week)});
    if(q.error)throw q.error;
    return mapRows(q.data);
  }
  async function fetchAvailableWeeks(sb,token,season,kind){
    requireToken(token);
    const rpc=kind==='nations'?'get_nations_league_available_weeks':'get_champions_league_available_weeks';
    const q=await sb.rpc(rpc,{p_token:token,p_season:season});
    if(q.error)throw q.error;
    return [...new Set((q.data||[]).map(row=>Number(row.week)).filter(Number.isFinite))].sort((a,b)=>a-b);
  }
  return{fetchChampionsWeek,fetchNationsWeek,fetchAvailableWeeks};
});
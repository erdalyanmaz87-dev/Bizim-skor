(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorLeagueUtils=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function normalizePerformance(rank,participantCount){
    const r=Number(rank),n=Number(participantCount);
    if(!Number.isInteger(r)||!Number.isInteger(n)||r<1||n<2||r>n)return null;
    return Math.round((100*((n-r)/(n-1)))*100)/100;
  }

  function isLeagueEligible(validRoundCount){
    return Number(validRoundCount)>=2;
  }

  function allocateLeagueCapacities(activeCount){
    const n=Math.max(0,Math.trunc(Number(activeCount)||0));
    if(!n)return{champions:0,elite:0,gold:0,silver:0,bronze:0};
    const champions=Math.round(n*0.10);
    const elite=Math.round(n*0.15);
    const gold=Math.round(n*0.20);
    const silver=Math.round(n*0.25);
    const bronze=n-champions-elite-gold-silver;
    return{champions,elite,gold,silver,bronze};
  }

  function promotionSlots(capacities={}){
    const c={
      champions:Math.max(0,Number(capacities.champions)||0),
      elite:Math.max(0,Number(capacities.elite)||0),
      gold:Math.max(0,Number(capacities.gold)||0),
      silver:Math.max(0,Number(capacities.silver)||0),
      bronze:Math.max(0,Number(capacities.bronze)||0)
    };
    const slot=(value,ratio)=>value>0?Math.max(1,Math.round(value*ratio)):0;
    return{
      champions_elite:slot(c.champions,0.25),
      elite_gold:slot(c.elite,0.33),
      gold_silver:slot(c.gold,0.31),
      silver_bronze:slot(c.silver,0.31)
    };
  }

  function describeLeagueStatus({rank,size,promotionSlots:promotion=0,relegationSlots:relegation=0,leagueCode}={}){
    const r=Number(rank),n=Number(size),up=Math.max(0,Number(promotion)||0),down=Math.max(0,Number(relegation)||0);
    if(!Number.isInteger(r)||!Number.isInteger(n)||r<1||n<1||r>n)return{state:'unknown'};
    if(String(leagueCode||'').toLowerCase()==='champions'&&r<=Math.max(1,up||1))return{state:'championship'};
    if(up>0&&r<=up)return{state:'promotion'};
    if(down>0&&r>n-down)return{state:'relegation'};
    return{state:'safe'};
  }

  return{normalizePerformance,isLeagueEligible,allocateLeagueCapacities,promotionSlots,describeLeagueStatus};
});

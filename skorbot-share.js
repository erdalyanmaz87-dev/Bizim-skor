(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorShare=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  async function getMatch(client,id,statistics=root.BizimSkorMatchStatistics,robot=root.BizimSkorRobotUI){
    if(!Number.isSafeInteger(id)||id<1)throw new Error('Geçersiz maç bağlantısı.');
    const snapshot=await statistics.loadSnapshot(client,id,'champions');
    const score=await robot.suggestion({id},{kind:'champions'});
    const team=name=>({name,logo:root.BizimSkorShareLogos?.[name]||root.BizimSkorBrandAssets?.teamLogoUrl(name)||''});
    return{home:team(snapshot.home_team||snapshot.home?.name),away:team(snapshot.away_team||snapshot.away?.name),week:Number(snapshot.week),score};
  }
  async function openShared(){
    const value=new URLSearchParams(root.location.search).get('skorbot')||(root.document.getElementById('skorbotPlayButton')?'champions-'+root.document.getElementById('skorbotPlayButton').dataset.fixture:''),match=/^champions-(\d+)$/.exec(value||'');if(!match)return;
    const id=Number(match[1]);
    try{
      const game=await getMatch(root.sb,id);let handle;
      handle=root.BizimSkorMatchAnimation.open({...game,applyLabel:root.BizimSkorChampionsUI?'Tahminime uygula':'Tahmin için oyuna geç',onApply:async()=>{
        handle.close();
        if(!root.BizimSkorChampionsUI){root.location.href='/?skorbot=champions-'+id;return false;}
        if(!root.localStorage.getItem('bizimSkorFriendToken')){
          root.document.getElementById('bsHeaderAccountAction')?.click();
          root.alert('Tahmin yapmak için hesabına giriş yap. Ardından Şampiyonlar Ligi bölümünde bu maçı seç.');return false;
        }
        root.BizimSkorChampionsUI.openPrediction();
        await root.BizimSkorActivePredictionWeekSelector.loadChampionWeek(game.week);
        root.document.getElementById('championsActiveWeekEdit')?.click();
        const input=root.document.getElementById('clh'+id),row=input?.closest('.champions-match');
        if(!input||input.disabled||input.readOnly||!row)throw new Error('Bu maç tahmin girişine kapalı.');
        const settings=root.BizimSkorRobotUI.config(),index=settings?.fixtures.findIndex(f=>Number(f.id)===id);
        if(!settings||index<0)throw new Error('Maç ekranı henüz hazırlanmadı. Bu maçın SkorBot düğmesine dokun.');
        const accepted=await root.BizimSkorRobotUI.applyOne({id},index,settings);
        if(accepted)for(const inputId of ['clh'+id,'cla'+id])root.document.getElementById(inputId)?.dispatchEvent(new Event('input',{bubbles:true}));
        return accepted;
      }});
    }catch(error){root.alert?.(error.message||'Paylaşılan maç şu anda açılamadı.');}
  }
  function mount(){const start=()=>{const button=root.document.getElementById('skorbotPlayButton');if(button){button.disabled=false;button.textContent='▶ Maçı oynat';button.onclick=async()=>{button.disabled=true;button.textContent='Maç hazırlanıyor…';try{await openShared();}finally{button.disabled=false;button.textContent='▶ Maçı oynat';}};}else openShared();};if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
  return Object.freeze({getMatch,openShared,mount});
});

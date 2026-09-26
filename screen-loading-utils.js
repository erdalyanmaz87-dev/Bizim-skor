(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorScreenLoadingUtils=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function loadingLabelForTarget(target,text=''){
    const value=String(target||'');
    const source=String(text||'').toLocaleLowerCase('tr-TR');
    if(value==='pred'||value==='championsPred'||value==='nationsPred'||source.includes('tahmin'))return 'Tahmin ekranı yükleniyor…';
    if(value==='resultsWeek'||source.includes('fikstür'))return 'Fikstür yükleniyor…';
    if(value==='footballCenter'||source.includes('futbol merkezi'))return 'Futbol Merkezi yükleniyor…';
    if(/ranking|general|weeklyrankings|arena/i.test(value)||source.includes('sıralama'))return 'Sıralama yükleniyor…';
    if(value==='history'||source.includes('geçmiş'))return 'Tahmin geçmişi yükleniyor…';
    return 'Veriler yükleniyor…';
  }
  function isLoadingText(text){return /yükleniyor/i.test(String(text||''));}
  return Object.freeze({loadingLabelForTarget,isLoadingText});
});

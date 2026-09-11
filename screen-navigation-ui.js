(function(root,factory){
  const api=factory(root?.BizimSkorScreenNavigation);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorScreenNavigationUI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(nav){
  const fallbackTitles={
    home:'Ana Sayfa',pred:'Tahmin Yap',arena:'Arena',championsRanking:'Şampiyonlar Ligi Genel Sıralaması',nationsRanking:'UEFA Uluslar Ligi Genel Sıralaması',general:'Süper Lig Genel Sıralaması',weeklyRankings:'Hafta Sıralaması',resultsWeek:'Fikstür',footballCenter:'Futbol Merkezi',friendLeagues:'Arkadaş Liglerim',history:'Tahmin Geçmişim',rules:'Kurallar',chat:'Sohbet',championsPred:'Şampiyonlar Ligi Tahminleri',nationsPred:'UEFA Uluslar Ligi Tahminleri',playerProfile:'Oyuncu Profili',supportPlayer:'Bize Ulaşın',supportAdmin:'Gelen Kutusu'
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function screenTitle(screen={}){
    if(screen.title)return String(screen.title);
    const id=nav?.canonicalScreenId?.(screen.id)||String(screen.id||'home');
    return nav?.screenDefinition?.(id)?.title||fallbackTitles[id]||'';
  }
  function screenShellMarkup(screen={}){
    return `<div class="bs-screen-shell" data-screen-id="${esc(screen.id||'')}"><header class="bs-screen-header"><button type="button" class="bs-screen-back" data-screen-back aria-label="Geri">← Geri</button><h1>${esc(screenTitle(screen))}</h1></header><main class="bs-screen-content" data-screen-content></main></div>`;
  }
  return Object.freeze({screenTitle,screenShellMarkup});
});

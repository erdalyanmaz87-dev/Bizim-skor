(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorSupportAdminView=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={login_pin:'Giriş / PIN',predictions:'Tahminler',points_ranking:'Puan / Sıralama',technical:'Teknik Sorun',suggestion:'Öneri',other:'Diğer'};
  const statusLabels={new:'Yeni',answered:'Cevaplandı',resolved:'Çözüldü'};
  function inboxButton(newCount=0){return `<button type="button" id="openSupportAdmin" class="full">📬 Gelen Mesajlar${newCount>0?` <span class="support-badge">${newCount}</span>`:''}</button>`}
  function filters(active='new'){return `<div class="support-admin-filters">${[['new','Yeni'],['answered','Cevaplandı'],['resolved','Çözüldü'],['all','Tümü']].map(([value,label])=>`<button type="button" data-support-filter="${value}"${active===value?' class="active"':''}>${label}</button>`).join('')}</div>`}
  function card(row={}){return `<article class="support-admin-card" data-request-id="${esc(row.id||'')}"><div><strong>${esc(row.player_name||'')}</strong><span>${esc(statusLabels[row.status]||row.status||'Yeni')}</span></div><small>${esc(labels[row.category]||'Diğer')}</small><p>${esc(row.message||'')}</p>${row.admin_reply?`<div class="support-reply"><b>Verilen cevap</b><p>${esc(row.admin_reply)}</p></div>`:''}${row.status!=='resolved'?`<textarea data-support-reply maxlength="1000" rows="3" placeholder="Cevabını yaz"></textarea><div class="support-admin-actions"><button type="button" data-support-reply-send>Cevapla</button><button type="button" data-support-resolve>Çözüldü</button></div>`:''}</article>`}
  function panel(rows=[],active='new'){return `<section class="support-admin-panel"><div class="support-head"><h2>📬 Gelen Mesajlar</h2><button type="button" data-support-admin-close>×</button></div>${filters(active)}<div id="supportAdminList">${rows.map(card).join('')||'<p class="small">Bu bölümde mesaj yok.</p>'}</div></section>`}
  return Object.freeze({inboxButton,filters,card,panel});
});

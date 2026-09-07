(function(root){
  function updateRules(){
    const section=root.document?.getElementById('rules');
    if(!section)return false;
    const headings=[...section.querySelectorAll('p')];
    const rule=headings.find(p=>p.textContent.includes('8. Sıralama ve Sezon Sonu Ödülleri'));
    if(!rule)return false;
    rule.innerHTML='<b>8. Sıralama ve Sezon Sonu Ödülleri 🏆</b><br><b>Oyun içi sıralama:</b> Tüm sıralamalarda öncelik her zaman <b>toplam puandır.</b> Oyuncuların puanları eşitse sıralama şu sıraya göre belirlenir:<br><br><b>1. Toplam puan</b><br><b>2. Sezon boyunca davet ettiği arkadaş sayısı</b><br><b>3. Tam skor sayısı 🎯</b><br><b>4. Doğru sonuç sayısı ⚽</b><br><b>5. Oyuna kayıt zamanı</b> (daha önce katılan önde)<br><br>Davet sayısı yalnızca <b>puan eşitliği durumunda</b> sıralama önceliği sağlar. Daha düşük puanlı bir oyuncu, daha fazla davet yaptığı için daha yüksek puanlı bir oyuncunun önüne geçemez. Davet sayıları puan sıralaması tablolarında gösterilmez; sistem tarafından arka planda eşitlik kriteri olarak kullanılır.<br><br><b>Sezon sonu ödülleri:</b> Genel sıralamadaki ilk üç ödül toplam <b>4.000 TL</b>\'dir: 🥇 <b>2.500 TL</b>, 🥈 <b>1.000 TL</b>, 🥉 <b>500 TL</b>. Ödül derecelerinde de aynı sıralama öncelikleri uygulanır. Tüm kriterlerin eşit kalması halinde ilgili derecelerin ödülleri birleştirilip eşit paylaşılır. Ödüller, dereceye giren oyuncunun tuttuğu takımın resmî mağazasında kullanabileceği hediye çeki olarak verilir.';
    return true;
  }
  function mount(){if(updateRules())return;let tries=0;const timer=root.setInterval(()=>{tries++;if(updateRules()||tries>20)root.clearInterval(timer)},150)}
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);

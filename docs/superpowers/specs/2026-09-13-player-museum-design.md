# Oyuncu Müzesi Tasarımı

## Amaç
Oyuncu profilinde kalıcı başarıları tek yerde sergileyen bir **🏛️ Müze** sekmesi oluşturmak. Müze, yalnız gerçek ve hesaplanabilir dereceleri gösterecek; başlamamış/bitmemiş haftalara kalıcı madalya vermeyecek.

## Bölümler

### Kupa Dolabı
Müzenin üstünde toplam 🥇 birincilik, 🥈 ikincilik, 🥉 üçüncülük ve 🏆 Arena şampiyonluğu sayıları gösterilir. Haftalık ilk üç dereceleri ve kesinleşmiş Arena ilk üç dereceleri bu sayılara dahildir.

### Haftalık Dereceler
Süper Lig, Şampiyonlar Ligi ve UEFA Uluslar Ligi ayrı gruplar halinde gösterilir. Yalnız tüm maçları sonuçlanmış bir haftada oyuncu ilk üçteyse müzeye girer. Satır örneği: `Süper Lig • 5. Hafta 🥇 1.`.

### Arena Başarıları
Arena dönemleri `1. Sezon (5–8. Haftalar)`, `2. Sezon (9–12. Haftalar)` biçiminde gösterilir. Kapalı dönemde `league_history.final_rank` kesin derece kaynağıdır. Açık dönemde mevcut `league_memberships.rank_in_league` yalnız **Devam ediyor** etiketiyle canlı önizleme olarak gösterilir ve Kupa Dolabı toplamlarına katılmaz. İlk üç derecede 🥇🥈🥉 simgesi, şampiyonlukta ayrıca 🏆 kullanılır. Terfi/düşme bilgisi varsa gösterilir.

### Genel Sıralama
Süper Lig, Şampiyonlar Ligi ve UEFA Uluslar Ligi için güncel genel sıra ayrı kartlarda gösterilir. Genel sıralama bir başarı madalyası değildir; Kupa Dolabı sayımına katılmaz.

## Veri ve güvenlik
Yeni `get_player_museum(p_token, p_player_name)` SECURITY DEFINER RPC'si mevcut oturum doğrulamasını kullanır. RPC yalnız sıralama/başarı özeti döndürür; gizli tahmin veya PIN/cihaz bilgisi döndürmez. Haftalık dereceler tamamlanmış haftalardan hesaplanır ve mevcut puan/tie-break kurallarıyla uyumlu tutulur.

## Arayüz
Mevcut oyuncu profil modalına `🏛️ Müze` girişi eklenir. Müze aynı modal içinde açılır; `← Profile Dön` ile önceki profil görünümüne dönülür. Boş bölümler kullanıcıya anlaşılır boş durum metni gösterir. Mobil görünüm mevcut profil kartı boyutlarını ve kaydırma davranışını korur.

## Kabul kriterleri
- Her oyuncunun profilinden Müze açılabilir.
- Kupa Dolabı 🥇🥈🥉 ve Arena 🏆 sayılarını doğru toplar.
- Haftalık bölümde yalnız tamamlanmış haftalardaki ilk üç dereceler bulunur.
- Üç organizasyon birbirinden ayrılır.
- Arena sezonu 1 için başlık `1. Sezon (5–8. Haftalar)` olur; sonraki dönemler aynı dört haftalık kalıpla devam eder.
- Açık Arena dönemi geçici olarak işaretlenir; kalıcı kupa sayılmaz.
- Genel sıralamada üç organizasyonun güncel sırası görünür.
- Mevcut oyuncu profili ve tahmin gizliliği bozulmaz.
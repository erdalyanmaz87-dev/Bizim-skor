# Bizim Skor Şampiyonlar Ligi Tasarımı

## Amaç

Bizim Skor'a, mevcut Süper Lig yarışmasından tamamen bağımsız çalışan bir Şampiyonlar Ligi tahmin yarışması eklemek. Oyuncular mevcut kullanıcı adı ve PIN'leriyle katılır; ayrı kayıt gerekmez. İlk sürüm 2026/27 Şampiyonlar Ligi 1. hafta fikstürünü içerir ve yarışma final bitene kadar sezonluk olarak devam eder.

## Kapsam

- Yeni `⭐ Şampiyonlar Ligi 1. Hafta` tahmin bölümü
- Yeni `🏆 Şampiyonlar Ligi Sıralaması` bölümü
- 8, 9 ve 10 Eylül 2026 tarihlerindeki toplam 18 maç
- Mevcut hesabıyla giriş yapan oyuncular için Şampiyonlar Ligi tahmini
- Şampiyonlar Ligi sezonu boyunca biriken bağımsız sıralama
- Sonuçlanan maçlara göre canlı puan güncellemesi ve tahmin görünürlüğü

Bildirim sistemi, Süper Lig fikstürü, Genel Sıralama, Sezu Ödül Sıralaması ve Arkadaş Ligleri bu çalışmanın kapsamı dışındadır.

## Fikstür

### 8 Eylül 2026 Salı

- 19.45 Club Brugge - Aston Villa
- 19.45 AEK - LASK
- 22.00 Real Madrid - Inter
- 22.00 Porto - Manchester City
- 22.00 Borussia Dortmund - Villarreal
- 22.00 Lille - Real Betis

### 9 Eylül 2026 Çarşamba

- 19.45 Barcelona - Feyenoord
- 19.45 Stuttgart - Viking
- 22.00 Liverpool - Atletico Madrid
- 22.00 PSG - Slovan Bratislava
- 22.00 Napoli - Arsenal
- 22.00 Sporting CP - Galatasaray

### 10 Eylül 2026 Perşembe

- 19.45 Fenerbahçe - Roma
- 19.45 PSV - Shakhtar Donetsk
- 22.00 Bayern Münih - Bodo/Glimt
- 22.00 Manchester United - Sabah
- 22.00 Como - Leipzig
- 22.00 Slavia Prag - Lens

Tüm saatler Türkiye saatidir. Veritabanında saatler UTC olarak saklanır ve arayüzde Türkiye saatine göre gösterilir.

## Oyun Kuralları

- Doğru maç sonucu yönü (1-X-2): 1 puan
- Tam skor: ek 3 puan; aynı maçtan toplam 4 puan
- Oyuncuların Şampiyonlar Ligi puanları Süper Lig puanlarına eklenmez.
- Sıralama önce toplam puan, sonra tam skor sayısı, sonra doğru sonuç sayısı ve son olarak oyuncu adına göre belirlenir.
- Eşit puanlı oyuncular mevcut oyundaki sıralama kuralına göre aynı sırayı paylaşır.
- Sıralamada yalnızca en az bir Şampiyonlar Ligi haftasında tahmin kaydeden aktif oyuncular bulunur.

## Tahmin ve Kilit Akışı

- Oyuncu mevcut doğrulanmış hesabıyla Şampiyonlar Ligi bölümüne girer.
- Ayrı kayıt veya ayrı PIN oluşturmaz.
- 1. haftadaki 18 maçın tamamını doldurup tek işlemle kaydeder.
- İlk maçın başlangıcı olan 8 Eylül 2026 saat 19.45'e kadar kayıtlı tahminlerin tamamını değiştirebilir.
- İlk maç başladığında 1. haftanın 18 maçı birlikte kilitlenir; yeni tahmin ve değişiklik kabul edilmez.
- Kilit hem arayüzde hem veritabanında uygulanır. Tarayıcı saati değiştirilerek veya doğrudan istek gönderilerek aşılamaz.

## Gizlilik

- Oyuncu kendi tahminlerini her zaman görür.
- Diğer oyuncuların bir maça ait tahmini, o maçın sonucu girilene kadar `*-*` görünür.
- Maç sonucu girildiğinde o maça ait tahminler ve kazanılan işaret/puan görünür olur.
- Tahmin tablolarına tarayıcıdan doğrudan okuma veya yazma yetkisi verilmez; işlemler doğrulanmış oturum belirteci kullanan güvenli veritabanı fonksiyonlarından geçer.

## Veri Mimarisi

Süper Lig tablolarına dokunulmadan aşağıdaki ayrı yapılar oluşturulur:

- `champions_league_fixtures`: sezon, hafta, ev sahibi, deplasman, başlangıç saati
- `champions_league_predictions`: oyuncu, fikstür ve tahmin skorları
- `champions_league_results`: fikstür ve gerçekleşen skor

Fikstür ve sonuçlar herkese salt okunur sunulabilir. Tahminler doğrudan erişime kapalı olur. Güvenli fonksiyonlar:

- oyuncunun kendi hafta tahminlerini getirir,
- kilit öncesinde 18 tahmini topluca kaydeder/günceller,
- sezonluk sıralamayı hesaplar,
- katılımcı tahminlerini maç bazlı gizlilik kuralıyla döndürür.

Mevcut `players` ve güvenli oyuncu oturumu kimliği kullanılır; yeni kullanıcı tablosu oluşturulmaz.

## Arayüz

Üst menüde ekran genişliğine göre alta geçen iki yeni sekme bulunur:

1. `⭐ Şampiyonlar Ligi 1. Hafta`
2. `🏆 Şampiyonlar Ligi Sıralaması`

Tahmin ekranında maçlar tarihe göre 8, 9 ve 10 Eylül başlıkları altında gruplanır. Kaydedilmiş tahminler mevcut Süper Lig ekranındaki gibi özetlenir ve kilit öncesinde `Tahminleri Düzenle` düğmesi gösterilir.

Sıralama ekranında sıra, oyuncu, puan, tam skor ve doğru sonuç alanları gösterilir. Alt bölümde katılımcı tahminleri mevcut yıldızlı gizlilik kuralıyla listelenir.

## Görsel Kimlik

Şampiyonlar Ligi bölümü, oyuncuya ayrı bir Avrupa turnuvasına geçtiğini hissettiren özgün bir gece temasına sahip olur:

- yalnızca iki Şampiyonlar Ligi sekmesinde koyu lacivert ve parlak mavi renk paleti,
- düşük yoğunluklu yıldız ışıkları ve stadyum gecesi hissi veren arka plan,
- beyaz başlıklar, parlak mavi vurgu ve mavi çerçeveli maç kartları,
- okunaklı beyaz skor alanları ve yeterli renk kontrastı,
- sıralamadaki ilk üç için altın, gümüş ve bronz vurgular,
- mevcut Bizim Skor marka işaretiyle uyumlu, ancak resmî UEFA logosunu kopyalamayan özgün yıldız detayları.

Tema mobil performansı düşürmeyen CSS tabanlı efektlerle hazırlanır; ağır arka plan görseli veya animasyon kullanılmaz. Diğer Bizim Skor sekmelerinin renkleri ve yerleşimi değişmez.

## Hata ve Güvenlik Davranışı

- Doğrulanmamış oyuncudan tahmin kabul edilmez.
- Eksik, tam sayı olmayan veya 0-20 aralığının dışındaki skorlar reddedilir.
- 18 maçın tamamı doldurulmadan toplu kayıt yapılmaz.
- Aynı oyuncu ve fikstür için tek tahmin kaydı tutulur.
- Pasif oyuncular sıralama ve katılımcı listesinde gösterilmez.
- Veritabanı hatasında mevcut kayıtlar silinmez; oyuncuya kısa hata mesajı gösterilir.

## Test ve Kabul Ölçütleri

- 18 fikstürün takım, tarih ve saatleri kaynak görsellerle eşleşir.
- Mevcut oyuncu hesabı ayrı kayıt olmadan tahmin yapabilir.
- Eksik tahmin kaydedilemez; tam set kaydedilebilir ve kilit öncesinde güncellenebilir.
- 8 Eylül 2026 19.45'ten sonra hem arayüz hem veritabanı kaydı reddeder.
- Puanlama 1+3 kuralını doğru uygular.
- Sonuçlanmamış maçlarda rakip tahminleri gizli, sonuçlanan maçlarda görünürdür.
- Şampiyonlar Ligi puanları Süper Lig, Genel, Sezu ve Arkadaş Ligi sıralamalarını değiştirmez.
- Mobilde iki yeni sekme yatay kaydırma olmadan görünür ve 18 maç rahat doldurulur.
- Şampiyonlar Ligi teması yalnızca ilgili iki bölümde görünür; metin ve skor kutuları mobilde erişilebilir kontrastı korur.
- Mevcut tüm testler ve yeni Şampiyonlar Ligi testleri geçmeden canlıya alınmaz.

# Bizim Skor — Ekran Gezinme ve Geri Dönüş Tasarımı

Tarih: 2026-09-11

## Amaç

Bizim Skor'da bir menü veya kart seçildiğinde içerik mevcut sayfanın aşağı bölümünde açılıyor. Mobil kullanıcı çoğu zaman ekranın değiştiğini fark etmiyor veya açılan içeriğin nerede olduğunu anlamak için aşağı kaydırmak zorunda kalıyor.

Yeni yapı, mevcut tek sayfalık uygulamayı ve çalışan veri akışlarını bozmadan her ana içeriği ayrı bir ekran gibi gösterecek. Kullanıcı hangi bölümde olduğunu net görecek ve `← Geri` ile bir önceki ekrana dönebilecek.

## Temel İlke

Ana Sayfa uygulamanın kök ekranıdır. Ana Sayfa dışındaki her görünüm bir ekran geçmişi (navigation stack) üzerinde açılır.

Örnek:

`Ana Sayfa → Süper Lig Genel Sıralaması → Erdal oyuncu profili`

Oyuncu profilindeki `← Geri` önce Süper Lig Genel Sıralaması'na döner. Sıralamadaki `← Geri` daha sonra Ana Sayfa'ya döner.

Geri davranışı hiçbir zaman koşulsuz olarak Ana Sayfa'ya atlamaz; önce gerçek bir önceki görünümü kullanır.

## Kapsam

Yeni ekran davranışı aşağıdaki mevcut alanların tamamını kapsar:

- Tahmin Yap
- Süper Lig haftalık / Hafta Sıralaması
- Süper Lig Genel Sıralaması
- Arena
- Şampiyonlar Ligi Genel Sıralaması
- Şampiyonlar Ligi tahmin / hafta görünümleri
- UEFA Uluslar Ligi Genel Sıralaması
- UEFA Uluslar Ligi tahmin / hafta görünümleri
- Fikstür / Haftanın Sonuçları
- Futbol Merkezi
- Arkadaş Liglerim
- Arkadaş ligi içindeki sıralama ve ilgili alt görünümler
- Tahmin Geçmişim
- Kurallar
- Sohbet
- Bize Ulaşın
- Erdal için Gelen Kutusu
- Oyuncu profili / oyuncu kartı detayları
- Ana Sayfadaki sıralama kartlarından açılan ilgili ekranlar

Ana Sayfa kök ekran olarak kalır ve ayrı ekran kabuğu içine alınmaz.

## Ekran Kabuk Yapısı

Ana Sayfa dışında açılan her birincil görünüm ortak bir ekran kabuğu içinde gösterilir:

- Üstte sabit `← Geri` düğmesi
- Ortada ekran başlığı
- Gerekirse sağda o ekrana özgü mevcut işlem
- Altında yalnız seçilen bölümün içeriği

Ana navigasyon şeridi, Ana Sayfa kartları ve gereksiz diğer bölümler bu görünüm sırasında ekranda kalmaz. Böylece kullanıcı yeni bir sayfaya geçtiğini açıkça anlar.

Mevcut bölüm DOM'u yeniden yazılmayacak. Yeni navigasyon katmanı mevcut section/modal içeriğini yönetir, görünürlük ve scroll davranışını kontrol eder.

## Navigation Stack

Her açılan ekran için aşağıdaki bilgiler tutulur:

- ekran kimliği
- başlık
- kaynak ekran
- scroll konumu
- gerekiyorsa alt görünüm bağlamı (hafta, lig, oyuncu adı vb.)

Birincil ekran seçildiğinde stack'e yeni kayıt eklenir.

Detay görünümü açıldığında mevcut ekran stack'te kalır ve detay yeni seviye olur.

`Geri` işlemi:

1. Mevcut detay/ekran kapanır.
2. Stack'teki önceki ekran geri yüklenir.
3. Önceki scroll konumu geri getirilir.
4. Stack'te önceki ekran yoksa Ana Sayfa açılır.

## Oyuncu Profili ve Diğer Detaylar

Mevcut oyuncu profili modalı ayrı bir detay ekranı olarak navigation stack'e bağlanır.

Örnekler:

- `Genel Sıralama → Oyuncu Profili → Geri = Genel Sıralama`
- `Hafta Sıralaması → Oyuncu Profili → Geri = Hafta Sıralaması`
- `Arkadaş Ligi → Oyuncu Profili → Geri = aynı arkadaş ligi görünümü`

Mevcut profil veri RPC'leri ve profil içeriği değiştirilmez.

Benzer şekilde açılır pencere/detay niteliğindeki yeni ekranlar da aynı geri sözleşmesini kullanır.

## Tarayıcı / Telefon Geri Hareketi

Uygulama içindeki `← Geri` ile tarayıcının veya PWA'nın sistem geri hareketi mümkün olduğunca aynı navigation stack'i kullanır.

History API kullanılır ancak mevcut URL yapısını ve uygulama açılışını bozacak gerçek çok sayfalı routing kurulmaz.

İlk aşamada hash/path değiştirmek zorunlu değildir. Ama history state ile geri hareketi yakalanır.

## Scroll Koruma

Bir ekran başka ekrana geçmeden önce mevcut scrollY değeri saklanır.

Örneğin sıralamada 35. oyuncuya kadar inip oyuncu profiline giren kişi geri döndüğünde sıralamanın en üstüne değil, yaklaşık aynı konuma döner.

Yeni bir birincil ekran ilk açılışta ekranın üstünden başlar.

## Kaydedilmemiş Veri Koruması

Tahmin ekranında mevcut kaydedilmemiş tahmin uyarısı korunur.

Navigation katmanı bir ekrandan çıkmadan önce o ekranın çıkış koruması (navigation guard) varsa onu çalıştırır.

Kullanıcı `Geri`, Ana Sayfa veya başka bir menü ile tahmin ekranından çıkarken kaydedilmemiş değişiklik varsa mevcut uyarı gösterilir. Kullanıcı vazgeçerse navigation gerçekleşmez.

## Mevcut Oyunu Bozmama Stratejisi

Bu çalışma mevcut iş mantığını yeniden yazmayacak.

Özellikle aşağıdakilere dokunulmayacak veya davranışları değiştirilmeden kullanılacak:

- tahmin kaydetme RPC'leri
- puanlama
- sıralama hesapları
- canlı skor
- arkadaş ligi verileri
- Şampiyonlar Ligi / UEFA Uluslar Ligi veri akışları
- oyuncu profil RPC'leri
- bildirim sistemi
- destek backend'i

Yeni sistem ayrı bir `screen-navigation` katmanı olarak mevcut UI'nın üstüne eklenecek.

Mevcut `.tab[data-tab]` tıklamaları ve Ana Sayfa kartları yeni katman tarafından izlenecek; ilgili mevcut yükleme fonksiyonları çalışmaya devam edecek.

## Menü Kapsamının Otomatik Kontrolü

Yeni navigasyon testi, mevcut yatay menünün tanımlı menü listesini okuyarak bütün kullanıcı menülerinin navigasyon sisteminde kayıtlı olduğunu doğrular.

Amaç gelecekte yeni bir menü eklendiğinde bu ekran davranışının unutulmamasıdır.

Tanımsız bir yeni `.tab[data-tab]` bulunursa test başarısız olmalı veya geliştirme sırasında açık şekilde raporlanmalıdır.

## Görsel Davranış

Mobilde ekran başlığı ve geri düğmesi üstte sabit/sticky olabilir.

Örnek:

`← Geri    Süper Lig Genel Sıralaması`

İçerik başlığın hemen altında başlar. Kullanıcı aşağıdaki eski section konumunu aramak zorunda kalmaz.

Ana Sayfa geri gelindiğinde mevcut header, kartlar, tahmin özetleri ve menü kaydırma konumu normal şekilde görünür.

## Erdal Gelen Kutusu

Erdal'ın `📬 Gelen Kutusu` girişi Ana Sayfa'da belirgin bir yönetici kartı olarak gösterilecek.

Kart yalnız server-side Erdal yetkisi doğrulandıktan sonra görünür.

Kart seçildiğinde `Gelen Kutusu` ayrı ekran olarak navigation stack'e eklenir. Mesaj detayından veya ileride eklenecek alt görünümden geri dönüş yine bir önceki destek ekranına yapılır.

Diğer oyuncular aynı bölgede yönetici kartını görmez. `📩 Bize Ulaşın` ise oyuncu/misafir destek erişimi olarak kendi ayrı ekranını açar.

## Hata Davranışı

Bir ekran veri yüklerken hata alırsa navigation stack bozulmaz. Ekran kendi hata durumunu gösterir ve `← Geri` her zaman önceki ekrana çalışır.

Bir alt modül yüklenemezse bütün uygulama navigation sistemi çökmez.

## Test Stratejisi

Uygulama TDD ile yapılacak.

En az aşağıdaki senaryolar otomatik testlenecek:

1. Ana Sayfa → her ana menü → Geri → Ana Sayfa.
2. Sıralama → oyuncu profili → Geri → aynı sıralama.
3. Arkadaş ligi → alt görünüm → Geri → aynı lig.
4. Scroll konumu korunuyor.
5. Kaydedilmemiş tahminde geri işlemi kullanıcı onayı olmadan gerçekleşmiyor.
6. Telefon/tarayıcı geri hareketi stack ile uyumlu.
7. Tüm mevcut yatay menü seçenekleri navigation kapsamına alınmış.
8. Erdal Gelen Kutusu ayrı ekran olarak açılıyor ve yalnız Erdal'a gösteriliyor.
9. Misafir Bize Ulaşın ayrı ekran olarak açılıyor.
10. Mevcut tab yükleme fonksiyonları ve veri davranışları değişmeden çalışıyor.

## Yayına Alma

Doğrudan production'da geliştirme yapılmayacak.

Önce izole feature branch oluşturulacak, testler çalıştırılacak ve Vercel preview üzerinden mobil görünüm kontrol edilecek.

Preview'da tüm ana menüler tek tek smoke test edilecek. Oyuncu profili geri zinciri ayrıca kontrol edilecek.

Production'a geçiş yalnız kullanıcı onayından sonra yapılacak.

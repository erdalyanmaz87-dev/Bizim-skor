# BizimSkor Navigasyon ve Performans Stabilizasyonu Tasarımı

## Amaç
Oyunun genelinde hissedilen yavaşlamayı azaltmak, özellikle Arena ekranından ana sayfaya dönüş sonrası alt menünün tepkisiz kalması gibi navigasyon kilitlenmelerini ortadan kaldırmak ve bunu mevcut tahmin, sıralama, canlı skor ve veritabanı davranışlarını bozmadan yapmak.

## Kapsam
Bu çalışma iki eksende ilerleyecek:

1. Navigasyon stabilitesi: Arena -> Ana Sayfa -> Menü akışı başta olmak üzere ekran değişimlerinde açık kalan overlay/backdrop, yinelenen event listener, stale UI state ve focus katmanları temizlenecek. Menü tek bir güvenilir açma/kapama akışına bağlanacak.
2. Genel hızlandırma: başlangıçta yüklenen UI dosyaları incelenecek; kritik olmayan modüller lazy/deferred yüklemeye taşınacak. Aynı DOM'u tekrar tekrar izleyen MutationObserver'lar ve gereksiz zamanlayıcılar azaltılacak. Aynı script veya event bağının iki kez kurulması engellenecek.

## Korunacak Davranışlar
- Süper Lig ve Şampiyonlar Ligi tahmin verileri ve tahmin giriş akışları değişmeyecek.
- Sıralama puanlama ve tie-break kuralları değişmeyecek.
- Canlı skor/veri sorgulama mantığı değişmeyecek.
- Arena lig kuralları ve hesaplamaları değişmeyecek; yalnız görsel sınıflandırma hataları düzeltilebilir.
- Supabase tablo yapıları ve production verileri bu çalışma kapsamında değiştirilmez.
- Açık/koyu tema, bildirim, arkadaş ligi ve yönetici ekranları korunur.

## Teknik Yaklaşım
### 1. Navigasyon durum yöneticisi
`simple-navigation.js` içindeki drawer ve feature-layer açma/kapama fonksiyonları tek bir durum temizleme noktasına bağlanacak. Yeni ekran açılmadan önce eski overlay ve body sınıfları temizlenecek. Arena gibi ayrı ekranlardan dönüşte de aynı reset fonksiyonu çağrılabilecek.

### 2. Event ve observer hijyeni
Mount fonksiyonları idempotent olacak. Aynı document üzerinde ikinci kez listener veya MutationObserver bağlanmayacak. Observer callback'leri yalnız ilgili DOM değiştiğinde çalışacak; tüm header/tabs subtree değişikliklerinde ağır yeniden çizim yapılmayacak.

### 3. Script yükleme bütçesi
`ui-integration-loader.js` içindeki modüller üç gruba ayrılacak:
- bootstrap/critical: ilk ekran ve temel navigasyon için gerekenler,
- interactive deferred: kullanıcı ilgili özelliğe yaklaşınca/idle durumda gerekenler,
- on-demand: admin, davet, müze, oyuncu profili gibi yalnız ilgili ekran açıldığında gerekenler.

Mevcut bağımlılık sırası korunacak; bir modül lazy yüklemeye taşınmadan önce kullanan dosyalar kontrol edilecek.

### 4. Arena görsel sınıflandırması
Arena tablosunda 'İlk 5 yükselir' kuralı ile satır boyama aynı kaynaktan beslenecek. 6. sıradaki oyuncunun yeşil görünmesi gibi off-by-one farkları testle sabitlenecek. Bu yalnız görsel sınıf atamasını etkiler; performans ve sıralama puanı hesabına dokunmaz.

## Test Stratejisi
- Arena -> Geri -> Ana Sayfa -> Menü: menü her seferinde açılmalı.
- Menü 20 kez aç/kapat sonrası yalnız bir listener/mount seti bulunmalı.
- Paylaşım, tahmin durumu, arkadaş ligleri gibi overlay'ler kapandıktan sonra görünmez backdrop kalmamalı.
- Loader testleri kritik script sırası ve lazy grupları doğrulamalı.
- Arena yükselme satır boyaması: yalnız 1-5 yeşil olmalı.
- Mevcut test paketi tamamı çalıştırılmalı; başarısız test varken production'a merge yapılmamalı.

## Başarı Kriterleri
- Bildirilen Arena dönüşü menü kilitlenmesi tekrarlanamaz hale gelir.
- İlk yükte çalıştırılan script sayısı azaltılır ve ağır UI modülleri ihtiyaç anına ötelenir.
- Tekrarlanan listener/observer birikimi engellenir.
- Kullanıcı akışlarında görünür regresyon oluşmaz.
- Production ancak test ve preview doğrulamasından sonra güncellenir.

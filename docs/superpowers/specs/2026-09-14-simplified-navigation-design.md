# Bizim Skor Sade Gezinme Tasarımı

## Amaç

Mobil ekranda yatay menü kalabalığını kaldırıp oyunun ana işlerini her an erişilebilir dört düğmede toplamak. Mevcut ekran ve sekme mantığı korunacak; yeni arayüz bu düğmeleri güvenli biçimde tetikleyen bir gezinme katmanı olacak.

## Arayüz

- Alt sabit çubuk: **Ana Sayfa**, **Tahmin Yap**, **Tahmin Durumu**, **Menü**.
- Tahmin Durumu düğmesi aktif turların tamamlanma yüzdesini yeşil bir ilerleme halkasında gösterir. Dokunulduğunda mevcut turnuva kartları, tamamlandı/yapılmadı bilgileri ve sayaçları ayrı bir panelde açılır.
- Menü düğmesi paneli baştan açar. Panel; Sıralamalar, Futbol, Sosyal, Hesabım ve Bilgi başlıkları altında gruplanır.
- Ayın Davet Şampiyonu ve davet sıralaması ana sayfadan kaldırılarak Menü içindeki Sosyal grubundan açılır.
- Üst bölümde logo, oyuncu adı ve bildirim simgesi kalır. Güncelleme, müze, destek ve çıkış işlemleri menü paneline taşınır.
- Açık/koyu mod anahtarı mevcut yerinde kalır.

## Davranış ve Erişilebilirlik

- Panel perdeye, kapatma düğmesine veya Escape tuşuna basınca kapanır.
- Açık panel odağı içine alır; kapanınca odağı paneli açan düğmeye geri verir.
- Seçili alt düğme `aria-current="page"` ile belirtilir.
- Sohbet bildirimi Menü düğmesinde ve Sohbet satırında kırmızı noktayla gösterilir.
- Eski sekmeler DOM içinde tutulur, görsel olarak gizlenir ve yeni menü seçimlerinde tıklanır.

## Dağıtım

Değişiklikler yalnızca `feature/simplified-navigation-preview` dalına gönderilir. Önizleme doğrulanıp kullanıcı onayı alınmadan `main` dalına birleştirilmez.

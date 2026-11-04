# Güvenlik raporu: 4 Kasım 2026 güncel durum

Bu dosya önceki inceleme notunun yerini alır. Sunucu korumaları önceki çalışmada canlıya uygulanmış, aşağıdaki kontrollerle tekrar doğrulanmıştır. Yeni web/Android kaynakları hazırlanmıştır; imzalı Android paketi ve canlı web sürümü bu dal üzerinden yayımlanmamıştır.

| # | Bulgu | Güncel durum |
| --- | --- | --- |
| 1 | İzinsiz bildirim | Canlı send-push v8, gövdeyi okumadan önce sunucu/cron sırrını doğruluyor. Eski gönderici kapalı. JWT'yi körlemesine açmak yerine mevcut cron yetkisi korunuyor. |
| 2 | Hesap sahiplenme | Canlıda anonim PIN atama kapalı; ön sorgular hesap/PIN durumunu ifşa etmiyor. PIN'siz hesaplara rastgele PIN atanmadı, bot/puan kayıtları bozulmadı. |
| 3 | Oyuncu listesi/e-posta adları | Anonim liste boş. Yeni e-posta biçimli ad sunucuda reddediliyor. Kullanıcının son talimatıyla iki pasif yanlış hesap, onlara ait 9 tahmin ve bağlı kayıtlar kalıcı silindi; yeniden oluşturulmayacak. Diğer Süper Lig tahminlerinin içerik özeti korunmuştur. |
| 4 | PIN denemeleri | Hesap kimliğiyle kalıcı 5 hata/15 dakika sınırı canlı. Gerçek pgcrypto ve farklı cihaz/ad büyük-küçük harf denemeleri geçici test hesabıyla doğrulandı. |
| 5 | Cihazla kurtarma | Canlı cihaz-ID sıfırlama kapalı. Sunucuda doğrulanmış bağlı e-posta oturumu yeni PIN belirleyebiliyor ve eski oyun oturumlarını kapatıyor. Web ve Android kodla kurtarma ekranları hazır; gerçek e-posta teslimi ve cihaz testi tamamlanmadı. |
| 6 | E-posta enumeration | Canlı gateway adaptörü mevcut/yeni e-posta için genel signup/recover yanıtını koruyor. Hazırlanan ek core uyumluluk değişikliği canlıya dağıtılmadı: otomatik onay denetimi canlı auth hizmetini değiştirmeyi reddetti. JWT ayarı mevcut public login/signup/recover akışı gereği false kalmalı; bunun yerine sunucu rate-limit ve sahiplik kontrolleri uygulanıyor. |
| 7 | Yönetici RPC'leri | Beş yönetim yolu gerçek veritabanında normal oyuncu ve boş token için reddedildi; süresi dolmuş yönetici oturumu da reddedildi. Test verileri geri alındı. |
| 8 | FileProvider | Android kaynakta external root kaldırıldı; yalnız cache/shared-images/ paylaşılabilir. Kaynak testi geçti; mevcut kurulu APK'nın izinleri yeni imzalı sürüm yüklenene kadar değişmez. |
| 9 | CSP | Web statik build'i ve Android son dönüştürülmüş HTML'si script hashleriyle CSP üretiyor. Stale dist dosyaları temizleniyor. Android'de web ve native hesap ekranlarının aynı anda açılması önlendi. Canlı web dağıtımı ve fiziksel cihaz kontrolü bekliyor. |
| 10 | Test build kimliği | Mevcut release APK'nın gerçek AndroidManifest paketi com.bizimskor.app, versionCode 3. Gömülü Capacitor ayarları test adını taşıyordu. Hazırlanan kaynak namespace/config/Java/strings aynı üretim kimliğine getirildi; aday versionCode 4 / 1.0.1. İmzalı AAB üretilmedi veya Play'e yüklenmedi. |

## Kontroller

- Güvenlik/frontend: 22 test başarılı; PGlite SQL senaryoları başarılı.
- Statik çıktı temizliği: eski/değiştirilmiş build dosyalarının dışarı sızmasını önleyen test başarılı.
- Android kaynak/bundle: 43 test başarılı; Capacitor Android sync başarılı.
- Gerçek PostgreSQL: geçici hesapla PIN sınırı, pgcrypto, e-posta sahipliği, eski oturum iptali ve 5 yönetici kontrolü başarılı. Tüm sentetik kayıtlar rollback ile kaldırıldı; gerçek e-posta/push gönderilmedi.
- Genel web paketinde önceden de başarısız olan 12 test vardır; bu dalın yeni başarılı testleri bunları ortadan kaldırmaz.
- Bağımsız kod incelemesiyle bulunan native CSP, hesap UI sıralaması ve stale build sorunları düzeltildi.

## Yayın sınırı ve engeller

Kullanıcıya sunulan bağlantı yalnız örnek ekran önizlemesidir; gerçek hesapla kurtarmanın uçtan uca kanıtı değildir. Canlı auth fonksiyonunu değiştirme isteği otomatik onay denetimince reddedildi. Reddedilen işlem başka kanaldan denenmedi. Yeni canlı web yayını veya auth değişikliği için açık yayın onayı gerekir.

İmzalı Android sürüm için mevcut üretim imzalama süreci gerekir. Bu çalışma ortamında yalnız JDK17 vardır; kaynak JDK21 ve Android SDK36 ister. Burada üretilmemiş APK/AAB için derlendi/mağazaya hazır denilmez. Mevcut imzayı yeni bir anahtarla değiştirmek doğru değildir.

Gerçek kurtarma e-postası teslimi, kullanıcının belirlediği adresle ayrıca denenmelidir. Kaynak testleri gerçek posta teslimi veya kurulu uygulama testi yerine geçmez.

Güvenlik danışmanındaki RLS açık/politikasız özel tablolar veya açık SECURITY DEFINER RPC uyarıları topluca yetki açarak kapatılmamalıdır; her RPC'nin sahiplik kontrolü değerlendirilmelidir. Sızmış şifre koruması ek bir ayardır; rapordaki zorunlu düzeltmenin yerine geçmez.

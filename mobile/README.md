# BizimSkor Android güvenlik güncelleme kaynağı

Üretim kimliği: `com.bizimskor.app`; aday versionCode 4 / versionName 1.0.1.

Kaynak 43 testten ve Capacitor sync kontrolünden geçmiştir. Native APK/AAB derlemesi veya mağaza yayını yapılmamıştır. JDK21, Android SDK36 ve mevcut üretim imzalama süreci gerekir; yeni imza anahtarı üretilmemelidir.

Dosya paylaşımı yalnız cache/shared-images/ ile sınırlı; CSP son dönüştürülmüş native HTML üzerinden üretilir. Web hesap modülleri native pakete alınmaz; tek native hesap ekranı kullanılır. PIN kurtarma bağlı e-posta ve doğrulama koduyla çalışır; cihaz kimliğiyle sıfırlama yapılmaz.

E-posta gönderimi, OTP şablonu ve gerçek cihaz kontrolü tamamlanmadan sürüm uçtan uca doğrulandı sayılmaz. Uygulama oyun/PIN oturumunu mevcut oyuncu kimliğiyle eşler; tekrar oyuncu oluşturmaz. Yanlış e-posta adlarıyla açılan iki pasif hesabın silinmesi kullanıcı talimatıyla canlıda yapılmıştır; bu hesaplar geri yüklenmemelidir.

Ayrıntılar: ../docs/security-report-status.md

# Android 1.0.1 güncellemesi

Kullanıcının onaylı Android güncelleme listesindeki yedi madde ve güvenlik düzeltmeleri bir araya getirilecek. Web/iOS kaynak davranışı değiştirilmeyecek. Mevcut com.bizimskor.app imzası korunacak; Play yayını yapılmayacak.

1. Dar ekranlarda takım adlarını tam göster, gerekirse sar.
2. Android yerel bildirim izni ve gelecekteki maç kapanışı için tahmin hatırlatmalarını ekle. Gerçek sunucu push gönderimi için Firebase/FCM yoksa bunu tamamlandı sayma.
3. Menü/Hesabım bölümünde parola, gizlilik, koşullar, hesap silme ve çıkış bağlantılarını göster.
4. Arena Kurallar düğmesinin tekrar çizimlerden sonra da açılıp kapanmasını sağlayacak Android'e özel olay yönlendirmesi ekle.
5. Ülke bayraklarını MIT lisanslı yerel SVG'lerle aynı kutu ve ölçüde göster; lisans dosyasını pakete ekle.
6. Profillerde mevcut 10/6/4/2 ve fırsat sembollerini doğrula; puan mantığını değiştirme.
7. Günün Maçları sağındaki Canlı Puan Durumu yönlendirmesini native pakette doğrula.

Önce davranış testlerini yaz ve hatalarını gör, sonra en küçük Android'e özel düzeltmeleri uygula. Kaynak, paket temizliği, güvenlik ve native yapılandırma kontrollerini çalıştır. JDK21/SDK36 kurulumuyla mevcut imzalı AAB ile aynı sertifikaya sahip yeni AAB üretip bundle doğrulaması yap. Fiziksel cihaz/FCM dış yapılandırma gereksinimini açıkça belirt.

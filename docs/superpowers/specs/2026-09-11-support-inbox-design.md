# Bizim Skor — Bize Ulaşın / Yönetici Destek Kutusu Tasarımı

## Amaç
Oyuncuların uygulama içinden yöneticiye destek mesajı gönderebilmesi, yöneticinin bu mesajları tek bir ekranda okuyup cevaplayabilmesi ve oyuncunun yönetici cevabını yine uygulama içinde görebilmesi.

## Kapsam
İlk sürümde kullanıcı hesabı ve mevcut giriş yapısı korunacak. Ayrı bir sohbet sistemi kurulmayacak; her destek kaydı konu bazlı tek bir talep olarak tutulacak ve talep içinde oyuncu mesajı ile yönetici cevabı yer alacak.

Kategoriler:
- Giriş / Şifre
- Tahminler
- Puan / Sıralama
- Teknik Sorun
- Öneri
- Diğer

Durumlar:
- Yeni
- Cevaplandı
- Çözüldü

## Oyuncu Deneyimi

### Giriş noktası
Mevcut kullanıcı alanında, “Bilgilerimi Güncelle” ve “Çıkış Yap” seçeneklerinin yanında/altında `📩 Bize Ulaşın` butonu yer alacak. Ana menüye yeni bir kalıcı sekme eklenmeyecek; böylece menü kalabalıklaşmayacak.

### Form
Oyuncu adı giriş yapan hesaptan otomatik alınacak ve değiştirilemeyecek. Oyuncu yalnızca:
1. kategori seçer,
2. en fazla 500 karakter mesaj yazar,
3. `Gönder` düğmesine basar.

Başarılı gönderimde kullanıcıya kısa bir onay gösterilir ve talep “Yeni” durumuyla kaydedilir.

### Geçmiş ve yönetici cevabı
`Bize Ulaşın` ekranında oyuncunun kendi son talepleri tarih sırasıyla gösterilir. Her kartta kategori, gönderim zamanı, mesaj, durum ve varsa “Yönetici cevabı” görünür.

Yönetici yeni cevap verdiğinde oyuncunun `📩 Bize Ulaşın` butonunda küçük bir kırmızı rozet gösterilir. Oyuncu ilgili cevabı açtığında rozet temizlenir.

## Yönetici Deneyimi

Yalnızca mevcut yönetici hesabına görünen `📬 Gelen Mesajlar` ekranı eklenecek.

Ekran üstünde hızlı filtreler bulunur:
- Yeni
- Cevaplandı
- Çözüldü
- Tümü

Her mesaj kartında:
- oyuncu adı,
- kategori,
- tarih-saat,
- oyuncu mesajı,
- mevcut durum
bulunur.

Yönetici kartı açarak bir cevap yazabilir. Cevap kaydedildiğinde talep otomatik olarak `Cevaplandı` durumuna geçer. Yönetici ayrıca `Çözüldü` olarak işaretleyebilir.

İlk sürümde yönetici cevabı tek alan olacaktır. Oyuncu aynı talebe ikinci mesaj ekleyemez; yeni bir konu için yeni talep açar. Bu tercih sistemi WhatsApp benzeri sürekli sohbete dönüşmekten korur ve yönetimi basit tutar.

## Veri Modeli

Yeni `support_requests` tablosu önerilir:
- `id`
- `player_name`
- `category`
- `message`
- `status` (`new`, `answered`, `resolved`)
- `admin_reply` nullable
- `created_at`
- `answered_at` nullable
- `resolved_at` nullable
- `player_seen_reply_at` nullable

Oyuncu adı doğrudan istemciden güvenilir kabul edilmemeli. Gönderme, listeleme ve cevabı okundu işaretleme işlemleri mevcut oturum/token doğrulamasını kullanan RPC fonksiyonları üzerinden yapılmalı.

Önerilen RPC sınırları:
- `create_support_request(...)`
- `list_my_support_requests(...)`
- `mark_support_reply_seen(...)`
- yönetici için `list_support_requests(...)`
- yönetici için `reply_support_request(...)`
- yönetici için `resolve_support_request(...)`

## Yetkilendirme ve Güvenlik

Oyuncu yalnızca kendi destek taleplerini görebilir. Başka oyuncunun kayıtlarını isim değiştirerek sorgulayamaz.

Yönetici işlemleri mevcut yönetici kimliğiyle sınırlandırılmalıdır. İstemciden gönderilen `is_admin=true` benzeri bir değere güvenilmemelidir.

Mesaj uzunluğu sunucu tarafında da 500 karakterle sınırlandırılır. Kategori yalnızca izin verilen değerlerden biri olabilir.

İlk sürümde dosya/fotoğraf eki bulunmayacak.

## UI Yerleşimi

Oyuncu tarafında destek özelliği profil/kullanıcı işlemlerine yakın tutulacak. `Bilgilerimi Güncelle`, `📩 Bize Ulaşın`, `Çıkış Yap` aynı kullanıcı alanının parçaları olacak.

Yönetici `📬 Gelen Mesajlar` butonunda yeni okunmamış talep sayısını rozet olarak görebilir. Yönetici ekranı normal oyuncular için DOM’da erişilebilir bir yönetim paneli olarak açılmamalı; mevcut yönetici görünürlük kontrolüyle yüklenmelidir.

## Hata Davranışı

Mesaj gönderilemezse form içeriği silinmez ve kullanıcıya yeniden deneme mesajı gösterilir.

Yönetici cevabı kaydedilemezse eski durum korunur; kullanıcıya cevaplandı gibi yanlış bir görünüm verilmez.

Aynı gönder düğmesine art arda basılması mükerrer kayıt üretmemeli; gönderme sırasında düğme geçici olarak pasif yapılır ve sunucu tarafında kısa süreli tekrar kontrolü uygulanabilir.

## Testler

En az şu senaryolar doğrulanacak:
- giriş yapmamış kullanıcı destek formuna erişemez,
- giriş yapan oyuncu mesaj gönderebilir,
- oyuncu sadece kendi taleplerini görebilir,
- 500 karakter üzeri mesaj reddedilir,
- geçersiz kategori reddedilir,
- yönetici tüm talepleri filtreleyebilir,
- yönetici cevap verdiğinde durum `Cevaplandı` olur,
- oyuncu cevabı görür ve rozet temizlenir,
- yönetici `Çözüldü` durumuna alabilir,
- normal oyuncu yönetici RPC’lerini çalıştıramaz,
- mevcut tahmin, giriş, profil ve arkadaş ligi akışları etkilenmez.

## Yayın Stratejisi

Geliştirme `feature/support-inbox-v1` dalında yapılacak. Testler ve önizleme kontrolü tamamlanmadan `main` veya production yayınına alınmayacak. Canlıya geçiş ayrıca kullanıcı onayıyla yapılacak.

## İlk Sürümde Özellikle Yapılmayacaklar

- gerçek zamanlı WhatsApp tarzı sohbet,
- fotoğraf/dosya ekleme,
- e-posta veya push ile yönetici cevabı bildirimi,
- birden fazla yönetici atama,
- talep öncelik/SLA sistemi.

Bunlar ihtiyaç oluşursa daha sonra ayrı geliştirme olarak ele alınabilir.

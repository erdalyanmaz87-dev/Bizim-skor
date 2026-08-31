# Kayıtlı Cihazla PIN Sıfırlama Tasarımı

## Amaç

PIN'ini unutan oyuncu, daha önce hesabına bağlanmış cihazdan yeni dört haneli PIN belirleyebilsin. Yönetici onayı veya WhatsApp iletişimi gerekmemeli. Kayıtlı olmayan cihazdan otomatik sıfırlamaya izin verilmemeli.

## Kullanıcı Akışı

1. Oyuncu giriş ekranındaki **Şifremi Unuttum** düğmesine basar.
2. Oyuncu adını yazar ve devam eder.
3. Sistem tarayıcıdaki cihaz kimliğini, oyuncunun sunucuda kayıtlı cihaz kimliğiyle karşılaştırır.
4. Cihaz eşleşirse **Yeni PIN** ve **Yeni PIN Tekrarı** alanları açılır.
5. Oyuncu dört haneli yeni PIN'ini belirler.
6. Başarıda PIN bcrypt ile yenilenir, mevcut arkadaş ligi oturumları iptal edilir ve oyuncu yeni PIN ile giriş ekranına yönlendirilir.
7. Cihaz eşleşmezse işlem yapılmaz ve şu mesaj gösterilir:

   > Bu hesap farklı bir cihazda kayıtlı. PIN sıfırlamak için yöneticiyle iletişime geçin.

8. Yönetici, kimliği başka bir kanaldan doğruladığı oyuncuya mevcut manuel yöntemle geçici PIN atayabilir.

## Güvenlik Modeli

- Otomatik sıfırlamanın kanıtı, oyuncunun `players.device_id` alanıyla eşleşen yüksek entropili cihaz kimliğidir.
- Oyuncu adı tek başına sıfırlama yetkisi sağlamaz.
- Yeni PIN yalnızca dört rakam olabilir ve açık metin saklanmaz veya loglanmaz.
- Başarılı sıfırlama oyuncunun bütün `friend_league_sessions` kayıtlarını siler.
- Cihaz kimliği sıfırlama sırasında değiştirilmez ve yeni cihaz hesaba bağlanmaz.
- Aynı oyuncu ve cihaz için başarısız denemeler hız sınırına tabidir.
- Oyuncu varlığını gereksiz yere açığa çıkarmamak için bilinmeyen isim ile cihaz eşleşmeyen hesap aynı genel destek mesajına döner.
- İstemci tarafındaki kontroller güvenlik sınırı değildir; bütün doğrulama SECURITY DEFINER RPC içinde yapılır.

## Veritabanı

Yeni tablo gerekmez. Mevcut `players` ve `friend_league_sessions` tabloları kullanılır.

### `reset_player_pin_from_registered_device`

Parametreler:

- `p_name text`
- `p_device_id text`
- `p_new_pin text`

Davranış:

1. Oyuncu adını mevcut normalleştirme kurallarıyla bulur.
2. `p_device_id` değerinin boş olmamasını ve oyuncunun kayıtlı cihazıyla tam eşleşmesini zorunlu kılar.
3. Yeni PIN'in `^[0-9]{4}$` biçiminde olduğunu doğrular.
4. Oyuncu ve cihaz için kısa süreli deneme sınırı uygular.
5. PIN'i `crypt(p_new_pin, gen_salt('bf'))` ile yeniler.
6. Oyuncunun mevcut arkadaş ligi oturumlarını siler.
7. `force_pin_once=false` yapar; yeni PIN zaten oyuncu tarafından seçildiği için zorunlu ikinci değişiklik gerekmez.
8. Başarıda yalnız boolean döndürür; isim, cihaz veya PIN verisi döndürmez.

RPC yalnız `anon` ve `authenticated` rollerine `execute` olarak açılır; tabloların mevcut RLS koruması değişmez.

## Hız Sınırı

Kalıcı deneme takibi için küçük bir `pin_reset_attempts` tablosu kullanılır:

- `device_hash text`
- `attempted_at timestamptz`
- `succeeded boolean`

Tablo RLS ile tamamen kapalıdır ve yalnız RPC tarafından kullanılır. Aynı cihazdan 15 dakika içinde en fazla beş sıfırlama denemesi yapılabilir. Eski kayıtlar işlev içinde veya zamanlanmış bakım sırasında temizlenebilir.

## Arayüz

- Giriş kartına ikincil **Şifremi Unuttum** düğmesi eklenir.
- Düğme açılır bir form gösterir: oyuncu adı, yeni PIN, yeni PIN tekrarı.
- PIN alanları sayısal klavye açar ve dört karakterle sınırlıdır.
- Başarı mesajı:

  > PIN'iniz güncellendi. Yeni PIN'inizle giriş yapabilirsiniz.

- Cihaz eşleşmiyorsa veya oyuncu bulunamıyorsa ortak destek mesajı gösterilir.
- Form işlem sırasında düğmeyi devre dışı bırakır; çift gönderimi engeller.

## Hata Durumları

- Hatalı PIN biçimi istemcide ve sunucuda reddedilir.
- Beş deneme sınırı aşılırsa 15 dakika bekleme mesajı gösterilir.
- Ağ hatasında PIN değişmiş kabul edilmez; kullanıcı tekrar denemeden önce yeni PIN ile giriş yapmayı deneyebilir.
- Veritabanı işleminde PIN güncellemesi ve eski oturumların silinmesi aynı transaction içinde gerçekleşir.

## Testler

- Kayıtlı cihaz doğru PIN biçimiyle sıfırlama yapabilir.
- Yanlış veya boş cihaz kimliği sıfırlama yapamaz.
- Bilinmeyen isim ile cihaz uyuşmazlığı aynı genel cevabı verir.
- Dört rakam dışındaki PIN reddedilir.
- Başarılı sıfırlama eski arkadaş ligi oturumlarını siler.
- Beş başarısız denemeden sonra hız sınırı çalışır.
- Giriş ekranında düğme ve form görünür; PIN tekrarı kontrol edilir.
- Başarı ve destek mesajları doğru gösterilir.
- Mevcut giriş, profil güncelleme, tek cihaz ve arkadaş ligi testleri gerilemez.

## Yayınlama

1. Migration testleri kırmızı olarak yazılır.
2. Migration uygulanır ve Supabase güvenlik/performance danışmanları kontrol edilir.
3. Arayüz testleri kırmızı olarak yazılır, sonra en küçük kod değişikliği uygulanır.
4. Bütün testler ve statik kontroller çalıştırılır.
5. PR ana dala alınır, Vercel yayını ve canlı giriş ekranı doğrulanır.

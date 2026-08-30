# Bizim Skor Canlı Skor Otomasyonu Tasarımı

**Tarih:** 30 Ağustos 2026  
**Durum:** Kullanıcı tarafından sözlü olarak onaylanan tasarımın inceleme sürümü

## Amaç

Bizim Skor ana ekranındaki “Bugünün Maçları” kartlarını canlı skorla zenginleştirmek, o anki skoru tam tahmin eden oyuncuları maç kartının altında göstermek ve maç bittikten sonra sonucu güvenli biçimde otomatik işlemek.

Sistem hem Süper Lig hem Şampiyonlar Ligi maçlarında çalışacak. Mevcut tahmin gizliliği, puanlama, Sezu sıralaması, genel sıralama ve arkadaş liglerinin hesaplama kuralları değişmeyecek.

## Kullanıcı Deneyimi

Her maç ayrı kartta gösterilir:

- Başlamayan maç: başlama saati ve takım adları.
- Canlı maç: `🔴 CANLI`, dakika ve güncel skor.
- Canlı kartın altında yavaş kayan bant: `🎯 Şu an tam bilenler: ...`
- Tam bilen yoksa: `Şu an tam skoru bilen yok.`
- Skor değiştiğinde kısa, sessiz `⚽ GOL!` vurgusu. Ses, titreşim veya bildirim yok.
- Biten maç: `MS` ve kesinleşen skor.
- Veri geçici olarak yenilenemiyorsa son doğrulanmış skor korunur ve `Canlı veri geçici olarak güncellenemiyor` açıklaması gösterilir.

Oyuncu adları yalnızca maçın başlangıç saati geçtikten sonra gösterilir. Böylece maç öncesi tahmin gizliliği korunur.

## Veri Kaynağı ve Kota

İlk sürüm API-Football ücretsiz paketiyle çalışır.

- Canlı maç penceresinde en fazla beş dakikada bir sağlayıcı sorgusu yapılır.
- Aynı anda oynanan tüm maçlar tek sağlayıcı sorgusundan alınır.
- Maç olmayan zamanlarda dış servise sorgu gönderilmez.
- Günlük sağlayıcı sorgu sayısı sunucuda tutulur.
- Ücretsiz kotayı zorlamamak için güvenli sınır 95 sorgudur. Sınır dolunca o gün yeni dış sorgu yapılmaz.
- Kota dolduğunda mevcut skor silinmez, sonuç tahmin edilmez ve otomatik sonuç kaydı yapılmaz. Yönetici skoru manuel işleyebilir.
- Sağlayıcı anahtarı tarayıcıya gönderilmez; yalnızca sunucu ortamında saklanır.

Ücretsiz paket Süper Lig veya Şampiyonlar Ligi’nin gerekli sezonunu sağlamazsa ya da gecikme kabul edilemez düzeydeyse API-Football Pro’ya geçiş ayrıca kullanıcı onayına sunulur. Sağlayıcı değişimi arayüz ve puanlama kodunu etkilememelidir.

## Sunucu Mimarisi

### Zamanlanmış kontrol

Supabase zamanlayıcısı beş dakikada bir güvenli bir Edge Function çağırır. İşlev önce veritabanındaki fikstürü kontrol eder:

1. Başlama saatinden kısa süre önce başlayıp henüz kesinleşmemiş maç var mı?
2. Yoksa dış servise hiç istek göndermez.
3. Varsa o anda canlı olan maçları tek sorguda ister.
4. Sağlayıcı maçlarını önceden doğrulanmış iç fikstür eşleştirmeleriyle bağlar.
5. Canlı skor önbelleğini ve sorgu sayacını günceller.

Takım adından anlık ve belirsiz eşleştirme yapılmaz. Her iç fikstür, sağlayıcının fixture kimliğiyle önceden eşleştirilir. Eşleşmeyen maç otomatik işlenmez ve yönetici incelemesine bırakılır.

### İzole veriler

Canlı skor sistemi mevcut `fixtures`, `predictions` ve `results` tablolarının anlamını değiştirmez. Ayrı ve RLS korumalı kayıtlar kullanır:

- Fikstür–sağlayıcı eşleştirmeleri.
- Son alınan canlı skor, dakika, durum ve alınma zamanı.
- Günlük sağlayıcı sorgu sayısı.
- Kesin sonuç adayı ve doğrulama durumu.
- Otomatik veya manuel sonuç kaynağına ilişkin denetim kaydı.

Tarayıcı yalnızca sınırlı bir okuma RPC’si üzerinden bugünün maç kartlarını görür. Sağlayıcı anahtarı, ham yanıt ve yönetim alanları hiçbir istemciye açılmaz.

## Sonucun Otomatik İşlenmesi

Bir sonuç yalnızca aşağıdaki koşulların tamamı sağlandığında işlenir:

1. Sağlayıcı maçı `FT`, `AET` veya eşdeğer kesin bitiş durumunda gösterir.
2. Aynı bitiş durumu ve skor art arda iki ayrı kontrolde değişmeden gelir.
3. İç fikstür ile sağlayıcı fikstürü önceden doğrulanmış biçimde eşleşir.
4. Maç ertelenmiş, iptal edilmiş veya yarıda kalmış değildir.
5. Yönetici tarafından kilitlenmiş manuel bir sonuç yoktur.

Koşullar sağlanınca sonuç ilgili müsabakanın mevcut sonuç tablosuna tek işlem içinde yazılır. Mevcut puanlama ve sıralama kodu bu sonuç üzerinden kendiliğinden çalışır. Süper Lig sonucu `results`, Şampiyonlar Ligi sonucu `champions_league_results` tablosuna gider; iki yarışma birbirine karışmaz.

Manuel sonuç daha sonra girilirse `manual_override` önceliklidir ve otomasyon bu skoru yeniden yazamaz.

## Tam Skoru Bilenler Bandı

Sunucu RPC’si, canlı skorla birebir aynı tahmini yapan aktif oyuncuları hesaplar:

- Süper Lig için yalnız ilgili fixture tahminleri kullanılır.
- Şampiyonlar Ligi için yalnız ilgili Champions League tahminleri kullanılır.
- Pasif oyuncular gösterilmez.
- Maç başlamadan hiçbir oyuncunun tahmini veya adı bu hesap üzerinden açıklanmaz.
- İsimler Türkçe ada göre kararlı biçimde sıralanır.

Bu liste yalnız bilgi amaçlıdır; canlı skor puanlamaya yazılmaz. Puan ancak kesin sonuç kaydedildikten sonra hesaplanır.

## Hata ve Güvenlik Davranışı

- Sağlayıcı zaman aşımı, kota hatası veya geçersiz yanıt verirse son doğru veri korunur.
- Eski veri, alınma zamanı üzerinden `Güncelleme gecikti` olarak işaretlenir.
- Eksik veya mantıksız skor otomatik sonuç olamaz.
- API anahtarı Supabase secret/Vault veya eşdeğer sunucu sırrında tutulur; git deposuna ve tarayıcı koduna yazılmaz.
- Edge Function yalnız zamanlayıcıdan veya gizli yönetim yetkisiyle çağrılabilir.
- Canlı skor tablolarında RLS açık olur; `anon` doğrudan tablo erişimi alamaz.
- Her otomatik sonuç işlemi kaynak, zaman, eski değer ve yeni değerle denetim kaydına yazılır.

## Test ve Kabul Ölçütleri

### Otomatik testler

- Maç yokken dış API çağrısı yapılmaması.
- Aynı anda üç maç için tek sağlayıcı çağrısı yapılması.
- Beş dakikalık aralığın ve günlük 95 sorgu güvenlik sınırının uygulanması.
- Maç öncesi oyuncu isimlerinin gizli kalması.
- Canlı skorda yalnız tam bilen aktif oyuncuların gösterilmesi.
- İlk `FT` yanıtında sonuç yazılmaması; aynı skorla ikinci `FT` yanıtında yazılması.
- Erteleme, iptal, yarıda kalma ve API hatasında sonuç yazılmaması.
- Manuel sonucun otomasyon tarafından ezilmemesi.
- Süper Lig ile Şampiyonlar Ligi sonuçlarının ayrı tablolara gitmesi.
- Mevcut puanlama, genel sıralama, Sezu ve arkadaş ligi testlerinin değişmeden geçmesi.

### Canlı doğrulama

- Bir test fikstüründe başlamadı, canlı, gol, devre, devam ve bitti durumlarının kartta doğru görünmesi.
- Skor değişiminde sessiz gol vurgusu ve bilenler bandının yenilenmesi.
- API devre dışı bırakıldığında son skorun korunması ve gecikme mesajının görünmesi.
- Kesin sonuçtan sonra puan ve sıralamaların tek kez güncellenmesi.

## Kapsam Dışı

- Canlı bildirim gönderme.
- Sesli gol uyarısı.
- Oyuncuların maç öncesi tahminlerini açıklama.
- Bahis oranları, istatistikler, kartlar veya oyuncu olayları.
- Ücretli pakete kullanıcı onayı olmadan geçme.

## Yayına Alma

Önce izole geliştirme dalında sahte sağlayıcı yanıtlarıyla test edilir. Ardından gerçek ücretsiz API anahtarıyla yalnız bir maç gününde gözlem modu çalıştırılır; bu aşamada otomatik sonuç yazma kapalıdır. Canlı skor ve sağlayıcı bitiş durumu manuel kaynakla karşılaştırıldıktan sonra otomatik sonuç işleme açılır. Tüm eski oyun testleri geçmeden ana sürüme alınmaz.

# Bizim Skor Ligleri — Tasarım Dokümanı

## Amaç
Bizim Skor'a sezon ortasında katılan oyuncuların da sürdürülebilir şekilde rekabet içinde kalmasını sağlayan, mevcut haftalık ve turnuva sıralamalarını bozmadan çalışan tek bir ortak lig sistemi eklemek.

## Temel İlke
Yeni sistemin adı **Bizim Skor Ligleri** olacak. Arayüzde kısa sekme adı **Ligim** olarak kullanılacak. Sistem Süper Lig, Şampiyonlar Ligi ve Uluslar Ligi için ayrı ligler oluşturmayacak; tüm resmi tahmin turlarındaki performansları tek ortak lig sisteminde birleştirecek.

## Ligler
Beş kademe bulunacak:
1. Şampiyonlar Ligi
2. Elit Lig
3. Altın Lig
4. Gümüş Lig
5. Bronz Lig

Yeni oyuncular Bronz Lig'den başlar.

## Dönem Yapısı
- Her lig dönemi 4 hafta sürer.
- Yükselme ve düşme sadece 4 haftalık dönem sonunda uygulanır.
- Lig kapasiteleri ve yükselme/düşme kontenjanları dönem başında hesaplanır ve dönem boyunca sabit kalır.
- Dönem içinde yeni oyuncular gelse bile mevcut dönemin yükselme/düşme kontenjanları değişmez.
- Yeni dönem başında aktif oyuncu sayısına göre kapasiteler ve kontenjanlar yeniden hesaplanır.

## Aktif Oyuncu Kuralı
Bir oyuncunun lig sistemine dahil olabilmesi için 4 haftalık dönem içinde en az **2 ayrı tahmin turuna** katılması gerekir.

Bir oyuncu yalnızca 1 turda tahmin yaptıysa:
- mevcut haftalık/turnuva sıralamalarına katılır,
- Bizim Skor Ligleri sıralamasına dahil edilmez,
- arayüzde "Lig sistemine katılmak için 1 tahmin turu daha tamamla" mesajı gösterilir.

İkinci farklı tahmin turunu tamamladığında Bronz Lig sıralamasına girer.

## Ortak Performans Hesabı
Genel sezon sıralamaları doğrudan kullanılmayacak. Her tahmin turu bağımsız değerlendirilir.

Örnek turlar:
- Süper Lig 8. hafta
- Şampiyonlar Ligi 2. hafta
- Süper Lig 9. hafta
- Uluslar Ligi turu

Her turda oyuncunun o tura katılanlar arasındaki derecesi 0–100 arası normalize edilmiş performans puanına çevrilir.

Önerilen temel formül:
- performans = 100 × (1 - (sıra - 1) / katılımcı_sayısı)
- ilk sıra 100'e yakın değer alır,
- orta sıralar yaklaşık 50 civarı değer alır,
- alt sıralar daha düşük değer alır.

Lig dönemi performansı, oyuncunun dönem içinde katıldığı geçerli tahmin turlarındaki performans puanlarının ortalamasıdır.

Katılmadığı organizasyon veya tur oyuncuya 0 puan yazmaz.

## Eşitlik Kuralları
Dönem performans puanı eşitse sırasıyla:
1. daha fazla geçerli tahmin turuna katılan,
2. daha fazla tam skor bilen,
3. gerekirse mevcut sistemdeki giriş/tahmin zamanı önceliği
öne alınır.

## Lig Kapasiteleri
Aktif oyuncu sayısına göre dönem başında hedef dağılım:
- Şampiyonlar Ligi: %10
- Elit Lig: %15
- Altın Lig: %20
- Gümüş Lig: %25
- Bronz Lig: kalan %30

Yuvarlama toplam oyuncu sayısını kesin koruyacak şekilde yapılır.

## Yükselme ve Düşme
Her komşu lig sınırında karşılıklı kontenjan kullanılır. Böylece bir ligden kaç kişi çıkıyorsa üst ligden aynı sayıda kişi aşağı iner ve lig kapasitesi bozulmaz.

Örnek 63 aktif oyuncu:
- Şampiyonlar: 6
- Elit: 9
- Altın: 13
- Gümüş: 16
- Bronz: 19

Örnek dönem sonu değişimi:
- Şampiyonlar ↔ Elit: 2 kişi
- Elit ↔ Altın: 3 kişi
- Altın ↔ Gümüş: 4 kişi
- Gümüş ↔ Bronz: 5 kişi

Şampiyonlar Ligi'nde yukarı çıkış yoktur; üst sıralar şampiyonluk statüsü taşır. Bronz Lig'de aşağı düşme yoktur.

## Dönem İçinde Yeni Oyuncular
- Yeni oyuncu Bronz Lig'den başlar.
- En az 2 geçerli tahmin turunu tamamlayana kadar lig sıralamasına girmez.
- Dönem son haftasında ikinci turunu tamamlamış olsa bile mevcut dönemin sabit yükselme kontenjanını değiştirmez.
- Yeni dönem başladığında Bronz Lig'de devam eder.

İlk tam döneminde yüksek performans gösteren yeni oyuncular için ileride "hızlı yükselme" seçeneği değerlendirilebilir; ilk sürümde kapsam dışıdır.

## Arayüz Tasarımı
Yeni bir ana menü açılmayacak. Oyunu menülerle boğmamak için sistem mevcut **Sıralamalar** ekranına entegre edilecek.

### Ana Sayfa
Mevcut "Benim Durumum" alanında küçük lig özeti gösterilecek:
- Lig adı
- Lig içi sıra
- yükselme/düşme hattına uzaklık
- dönem bitimine kalan hafta

Örnek:
- Altın Lig — 4/13
- Yükselme hattına 1 sıra
- Dönem bitimine 2 hafta

Bu özet tıklanınca doğrudan Sıralamalar > Ligim ekranı açılır.

### Sıralamalar > Ligim
Yeni küçük sekme: **Ligim**

Varsayılan görünümde sadece oyuncunun bulunduğu lig gösterilir. 60–100 kişilik uzun tek tablo yerine oyuncu kendi ligindeki rakiplerini görür.

Lig tablosunda:
- yükselme bölgesi açık yeşil,
- düşme bölgesi açık kırmızı,
- kullanıcının satırı belirgin çerçeve ile gösterilir.

Üst bilgi:
- lig adı,
- oyuncu sayısı,
- dönem kaçıncı haftada,
- yükselme ve düşme kontenjanı.

### Diğer Ligler
Aynı ekranın altında küçük kartlar/chipler:
- Şampiyonlar
- Elit
- Altın
- Gümüş
- Bronz

Kullanıcı isterse başka bir lige basıp o lig sıralamasını görebilir. Ana deneyim kendi ligi üzerinde kalır.

### Lig Kuralları
Ligim ekranının sağ üstünde küçük **ⓘ Lig Kuralları** kontrolü bulunur. Basınca kısa bir alt panel/modal açılır.

Gösterilecek kurallar:
- Dönem 4 hafta sürer.
- Lig sistemine katılmak için en az 2 ayrı tahmin turu gerekir.
- Yeni oyuncular Bronz Lig'den başlar.
- Yükselme/düşme kontenjanları dönem başında sabitlenir.
- Süper Lig, CL ve Uluslar Ligi performansları tek ortak ligde değerlendirilir.
- Katılmadığın tur sana 0 puan yazmaz.
- Yükselme/düşme dönem sonunda uygulanır.

## Veri Modeli — Öneri
Yeni tabloların sorumlulukları ayrık tutulur:

### league_periods
4 haftalık dönemleri saklar:
- id
- period_no
- starts_at
- ends_at
- status
- active_player_count
- locked_capacities
- locked_promotion_slots

### league_memberships
Bir oyuncunun dönem içindeki lig üyeliği:
- period_id
- player_id veya player_name mevcut sistem standardına göre
- league_code
- starting_league_code
- is_eligible
- valid_round_count
- performance_score
- rank_in_league
- promotion_status

### league_round_performance
Her geçerli tahmin turundaki normalize performans:
- period_id
- player
- competition
- round_key
- participant_count
- rank
- performance_score
- exact_score_count

### league_history
Dönem kapanışındaki yükselme/düşme geçmişi:
- player
- period_id
- from_league
- to_league
- reason
- final_rank
- final_performance_score

## Veri Akışı
1. Bir tahmin turu sonuçlandıktan sonra o turun katılımcı sıralaması alınır.
2. Her katılımcı için normalize performans puanı hesaplanır.
3. league_round_performance güncellenir.
4. Oyuncu en az 2 farklı geçerli turu tamamladıysa lig için uygun hale gelir.
5. Dönem içi lig sıralaması performans ortalamasına göre hesaplanır.
6. Dönem sonunda kilitli kontenjanlara göre yükselme/düşme uygulanır.
7. Yeni dönem üyelikleri bir önceki dönemin sonucu üzerinden açılır; yeni uygun oyuncular Bronz'dan eklenir.

## Hata ve Sınır Durumları
- Katılımcı sayısı 1 ise performans 100 olarak ele alınmaz; bu tur lig hesabı için geçersiz sayılabilir.
- Sonradan iptal edilen veya sonuçsuz kalan maçlar mevcut puanlama kaynağıyla aynı şekilde lig performansına yansır.
- Aynı tahmin turu iki kez işlenirse idempotent anahtar ile mükerrer kayıt engellenir.
- Dönem kapanışı bir kez uygulanır; tekrar çalıştırıldığında ikinci kez yükselme/düşme yapılmaz.
- Oyuncu adı değişiklikleri mevcut oyuncu kimliği standardına bağlanır; mümkünse player_id kullanılır.

## Test Stratejisi
- 63, 69 ve 100 aktif oyuncuda kapasite toplamlarının oyuncu sayısını tam koruduğu test edilir.
- Komşu liglerde yükselen/düşen sayıların karşılıklı eşit olduğu test edilir.
- Dönem içinde yeni oyuncu eklendiğinde kilitli kontenjanların değişmediği test edilir.
- 1 tur yapan oyuncunun uygun olmadığı, 2. turdan sonra Bronz'a girdiği test edilir.
- Katılmadığı turun 0 puan yazmadığı test edilir.
- Farklı organizasyonlardaki farklı katılımcı sayılarının yüzdelik normalize edildiği test edilir.
- Dönem kapanışının idempotent olduğu test edilir.
- UI'da sadece kendi liginin varsayılan açıldığı, diğer liglerin isteğe bağlı görüntülendiği test edilir.

## İlk Sürüm Kapsamı
Dahil:
- 5 lig
- 4 haftalık dönem
- 2 tur aktiflik şartı
- normalize performans hesabı
- sabit dönem kontenjanları
- yükselme/düşme
- geçmiş kaydı
- ana sayfa lig özeti
- Sıralamalar > Ligim
- diğer ligleri görüntüleme
- lig kuralları

İlk sürümde kapsam dışı:
- hızlı yükselme bonusu
- özel rozet/ödül sistemi
- ayrı Lig Merkezi ana menüsü
- lig bazlı push bildirimleri

## Başarı Kriterleri
- Sezon ortasında giren oyuncu en geç ikinci geçerli tahmin turundan sonra Bronz Lig'de görünür.
- Oyuncunun 4 hafta boyunca yükselme/düşme hedefi değişmeyen net bir çizgiyle görünür.
- Mevcut Süper Lig, CL ve Uluslar Ligi sıralamaları bozulmaz.
- Yeni özellik ana menüyü kalabalıklaştırmaz.
- Lig kapasiteleri dönem sonunda matematiksel olarak dengeli kalır.
- Bir oyuncu katılmadığı organizasyon nedeniyle 0 puan cezası almaz.

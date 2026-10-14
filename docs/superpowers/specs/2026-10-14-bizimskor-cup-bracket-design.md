# BizimSkor Kupası: Seri Başı Kura ve 64 Kişilik Kupa Ağacı Tasarımı

**Tarih:** 14 Ekim 2026  
**Durum:** Kullanıcı tarafından sözlü tasarım onayı verildi; uygulama planı öncesi yazılı şartname  
**Hedef sezon:** İlk kupa, Süper Lig 8. hafta ile başlayacak eleme dönemi

## 1. Amaç

BizimSkor Kupası için, kura çekilmeden önce de oyunda görülebilen ve kura sırasında canlı dolan, Maçkolik benzeri yatay kaydırılan 64 kişilik bir kupa ağacı oluşturulacaktır.

Kura tamamen rastgele olmayacaktır. Katılımcılar kupadan önceki son iki tamamlanmış Süper Lig haftasındaki performanslarına göre seri başı ve seri başı olmayan iki havuza ayrılacak; her eşleşme bir seri başı ile bir seri başı olmayan oyuncudan kurulacaktır. Katılımcı sayısı 64'ten azsa eksik yerler `BAY` olarak dağıtılacaktır.

Eleme maçlarının skoru ham haftalık puan yerine, o haftanın resmî genel sıralamasındaki konuma göre hesaplanan `0–100` performans puanı olacaktır. Böylece her tur, haftadaki tüm oyunculara karşı gösterilen göreceli başarıyı ölçer.

## 2. Kapsam

Bu değişiklik şunları kapsar:

- Kura öncesinde boş 64 kişilik ağacın Kupa Ağacı sekmesinde gösterilmesi.
- Seri başı belirleme, iki havuz oluşturma ve kontrollü rastgele kura.
- `BAY` yerleştirme ve otomatik tur atlama.
- Kura animasyonu sırasında oyuncuların ilk tur kutularına yerleşmesi.
- Her ekranda seçili tur ile bir sonraki turu ve aralarındaki bağlantıları gösteren eleme ağacı.
- Her eleme haftası için canlı `0–100` performans puanı.
- Haftalık sonuç düzeltmelerinin kupa skorlarına güvenli biçimde yansıması.
- Mobilde tur tur yatay kaydırma, kaydırmaya bağlı aktif tur ve erişilebilir kullanım.

Bu değişiklik şunları değiştirmez:

- Haftalık/genel sıralamanın mevcut eşitlik kuralı.
- Normal tahmin puanlarının hesaplanması.
- Mevcut kupa kayıt süreci ve son kayıt zamanı.
- Kupanın tur haftaları: ilk tur 8. hafta, ardından sırasıyla 9–13. haftalar.
- SkorBot'un kupaya katılabilmesi. Mevcut ürün kuralı korunur: SkorBot yarışabilir fakat ödül kazanamaz; ödül sıradaki uygun gerçek oyuncuya geçer.

## 3. Kura Öncesi Kupa Ağacı

Kupa Ağacı sekmesi kura çekilmeden önce boş bir açıklama ekranı yerine gerçek turnuva ağacını gösterecektir:

- Toplam 64 ilk tur yeri bulunur.
- Son 64 görünümünde 32 ilk tur eşleşmesi ve sağlarında bağlandıkları Son 32 kutuları yer alır.
- Kullanıcı sağa kaydırdıkça sırasıyla Son 32, Son 16, Çeyrek Final, Yarı Final ve Final görünümüne geçer.
- Her görünüm seçili turu solda, bir sonraki turun kutularını sağda ve aradaki mavi bağlantı çizgilerini gösterir.
- Final görünümünde final eşleşmesinin sağında kupa bulunur.
- Kura öncesinde ilk tur kutularında `Kura bekleniyor` yazısı gösterilir.
- Sonraki tur kutuları pasif ve boş görünür.
- Ekran kura başlamadan önce de açılabilir; ağacın yapısı değişmeden kalır.

Bu yaklaşım, oyunculara kura yapısının önceden görünmesini ve kura sırasında aynı ekranda kutuların dolmasını sağlar.

## 4. Seri Başı Hesabı

### 4.1 Referans haftalar

Seri başı performansı, kupanın başladığı Süper Lig haftasından önceki son iki tamamlanmış Süper Lig haftasına göre hesaplanır:

- `start_week - 2`
- `start_week - 1`

İlk kupa 8. haftada başladığı için referans haftalar 6 ve 7'dir.

### 4.2 Katılım ve ortalama

Bir oyuncunun bir haftası, o haftada en az bir geçerli ve kaydedilmiş tahmini varsa `oynanmış hafta` sayılır. Eksik tahminle kaydedilmiş bir hafta da oynanmış kabul edilir ve oyuncunun o hafta elde ettiği gerçek puan kullanılır.

Seri başı ortalaması yalnızca oyuncunun katıldığı referans haftalar üzerinden alınır:

`seri_basi_ortalamasi = katıldığı referans haftalardaki toplam puan / katıldığı referans hafta sayısı`

Örnekler:

| 6. hafta | 7. hafta | Seri başı ortalaması |
|---:|---:|---:|
| 18 | 12 | 15.00 |
| Katılmadı | 16 | 16.00 |
| 10 | Katılmadı | 10.00 |
| Katılmadı | Katılmadı | 0.00 |

Bir oyuncunun iki referans haftanın yalnızca birine katılmış olması, o oyuncuyu otomatik olarak seri başı dışına çıkarmaz. Oynadığı tek haftanın puanı ortalaması olur.

### 4.3 Eşitlik sırası

Seri başı ortalaması eşitse mevcut ve sabit sıralama kuralı uygulanır:

1. Sezonluk davet sayısı
2. Tam skor sayısı
3. Doğru sonuç sayısı
4. Oyuna daha önce kayıt olma zamanı
5. Teknik son bağlayıcı olarak oyuncu kimliği

Tam skor ve doğru sonuç sayıları, seri başı hesabında kullanılan iki referans haftanın oynanan bölümlerinden toplanır. Mevcut sıralama motorunun ana kuralı değiştirilmez; kupa bu kuralı yeniden kullanır.

## 5. Havuzlar ve BAY Dağılımı

Kayıt kapanınca katılımcı sayısı `N` olarak alınır. Kupa en fazla 64 katılımcı kabul eder.

- Seri başı oyuncu sayısı: `ceil(N / 2)`
- Seri başı olmayan oyuncu sayısı: `floor(N / 2)`
- Sol kura havuzu 32 yere, sağ kura havuzu 32 yere tamamlanır.
- Eksik yerler `BAY` ile doldurulur.

60 oyuncu örneği:

| Havuz | Oyuncu | BAY | Toplam |
|---|---:|---:|---:|
| Seri başı | 30 | 2 | 32 |
| Seri başı olmayan | 30 | 2 | 32 |

Kurallar:

- Her eşleşmede sol kura havuzundan bir, sağ kura havuzundan bir yer çekilir.
- `BAY–BAY` eşleşmesine kesinlikle izin verilmez.
- Bir oyuncu `BAY` ile eşleşirse ilk turu otomatik geçer.
- BAY'lar iki havuza olabildiğince dengeli dağıtılır.
- Tek sayıda gerçek katılımcı olduğunda havuz büyüklükleri yukarıdaki `ceil/floor` kuralıyla belirlenir; gerekli BAY sayısı buna göre tamamlanır.
- Üretilen eşleşmeler daha sonra 32 ilk tur konumuna rastgele dağıtılır: 16 eşleşme sol yarıya, 16 eşleşme sağ yarıya.
- Kura tamamlandıktan sonra yeniden kura çekilmez. Yöneticiye yeniden kura yetkisi bu kapsamda eklenmez.

## 6. Canlı Kura Deneyimi

Kura ekranında iki fiziksel havuz açıkça ayrılır:

- Sol havuz: `Seri Başı`
- Sağ havuz: `Seri Başı Olmayan`

Her adımda iki havuzdan birer öğe çekilir. Çekilen ikili bir eşleşme oluşturur ve kupa ağacındaki ilk tur kutusuna yerleşir. Mevcut iki saniyelik eşleşme açıklama temposu korunabilir; ancak sayfa yenilendiğinde animasyonun durumu sunucudaki kesin kura verisinden yeniden oluşturulur.

Kura sonucu veritabanında tek transaction içinde üretilir. Ön yüzdeki animasyon yalnızca önceden kesinleşmiş sonucu sırayla açıklar; kura sonucunu istemci üretmez.

Kura sırasında veya sonrasında bağlantısı kopan kullanıcı, geri geldiğinde aynı eşleşmeleri aynı konumlarda görür.

## 7. Kupa Ağacı Görseli

### 7.1 Tur Görünümü

- Üstte yatay kayan tur düğmeleri bulunur: Son 64, Son 32, Son 16, Çeyrek Final, Yarı Final ve Final.
- İlk açılışta Son 64 düğmesi aktif olur.
- Her tur panelinde mevcut tur eşleşmeleri solda, onların bağlandığı bir sonraki tur kutuları sağda görünür.
- Eşleşme kutularında oyuncu adı, haftalık performans puanı ve kazanan durumu bulunur.
- Mevcut turdaki her iki eşleşme, mavi dirsekli çizgilerle bir sonraki turdaki tek kutuya bağlanır.
- Henüz belli olmayan sonraki tur oyuncularında `Bekleniyor` yazılır.
- BAY kutusu diğer oyunculardan görsel olarak ayrılır ve `Otomatik tur` etiketi taşır.
- Final panelinde final eşleşmesinin sağında kupa simgesi bulunur.

### 7.2 Mobil Yatay Geçiş

64 kişilik ağacın okunabilirliğini korumak için bütün turlar dar ekrana sıkıştırılmaz:

- Her tur ayrı, ekran genişliğinde bir kaydırma panelidir.
- Parmağı sola sürüklemek bir sonraki tura, sağa sürüklemek bir önceki tura götürür.
- Kaydırma `scroll-snap` ile tur paneline oturur.
- Üstte aktif tur düğmesi kaydırılan panelle eşzamanlı değişir.
- Tur düğmesine dokunmak doğrudan ilgili panele kaydırır.
- Eşleşme kartlarının genişliği sabit ve okunabilir kalır; yakınlaştırma kontrolü kullanılmaz.
- Kaydırma sırasında sayfanın dikey hareketi engellenmez.

### 7.3 Erişilebilirlik

- Her eşleşmenin anlamlı ekran okuyucu etiketi bulunur.
- Renk tek başına kazanan/kaybeden göstergesi olmaz; metin/ikon da kullanılır.
- Kullanıcının `reduced motion` tercihi varsa kura geçiş animasyonları azaltılır.
- Dokunma hedefleri en az 44×44 CSS piksel olur.

## 8. Eleme Performans Puanı

### 8.1 Kaynak sıralama

Her kupa turunun performans puanı, o turun bağlı olduğu Süper Lig haftasının resmî haftalık sıralamasından gelir. Yalnızca kupa katılımcıları arasında yeni bir sıralama yapılmaz; oyuncunun tüm resmî haftalık katılımcılar içindeki konumu esas alınır.

Resmî sıra, mevcut sabit sıralama kuralıyla tekil olarak belirlenir:

`haftalık puan → sezonluk davet → tam skor → doğru sonuç → kayıt zamanı`

### 8.2 Formül

Haftaya katılan oyuncu sayısı `P`, oyuncunun tekil resmî sırası `R` ise:

`performans = ((P - R) / (P - 1)) × 100`

- Birinci oyuncu `100.00` alır.
- Sonuncu oyuncu `0.00` alır.
- Aradaki oyuncular sıralarına göre doğrusal puan alır.
- Sonuç ekranda iki ondalıkla gösterilir.
- Haftada tek katılımcı varsa puanı `100.00` olur.
- O haftaya hiç geçerli tahmin vermeyen kupa oyuncusu `0.00` alır.

Örnek: 51 katılımcılı bir haftada 11. olan oyuncunun puanı:

`((51 - 11) / 50) × 100 = 80.00`

### 8.3 Canlı güncelleme ve kesinleşme

- Haftalık maçlar oynandıkça resmî sıra ve kupa performansı canlı değişir.
- Kupa ağacındaki puanlar da aynı veriden güncellenir.
- Tur sonucu, haftanın tüm maçları tamamlandığında kesinleşir.
- Sonuç sonradan düzeltilirse performanslar ve kazanan, idempotent yeniden hesaplama ile güncellenir; sonraki tur henüz başlamış olsa bile veri tutarlılığı korunur.

### 8.4 Eşit kupa puanı

İki rakibin iki ondalığa yuvarlanmamış performans değeri eşitse, turun bağlı olduğu haftadaki mevcut eşitlik sırası uygulanır:

1. Sezonluk davet sayısı
2. O haftaki tam skor sayısı
3. O haftaki doğru sonuç sayısı
4. Oyuna daha önce kayıt olma zamanı
5. Oyuncu kimliği

Karşılaşma kararı hesaplanırken ham hassas değer kullanılır; yalnızca gösterim iki ondalığa yuvarlanır.

## 9. Tur Yapısı

Mevcut altı turlu yapı korunur:

| Tur | Süper Lig haftası | Oyuncu/eşleşme |
|---|---:|---:|
| Son 64 | 8 | 64 oyuncu / 32 eşleşme |
| Son 32 | 9 | 32 oyuncu / 16 eşleşme |
| Son 16 | 10 | 16 oyuncu / 8 eşleşme |
| Çeyrek final | 11 | 8 oyuncu / 4 eşleşme |
| Yarı final | 12 | 4 oyuncu / 2 eşleşme |
| Final | 13 | 2 oyuncu / 1 eşleşme |

Mevcut üçüncülük maçı 13. haftada korunur ve ağaçta finalin altında ayrı gösterilir.

## 10. Veri Modeli ve Sunucu Değişiklikleri

Yeni migration aşağıdaki yetenekleri eklemelidir:

- Kupanın tam 64 gerçek oyuncu şartını kaldırmak.
- Seri başı hesap özetini kura anında saklamak veya yeniden üretilebilir biçimde kaydetmek.
- İlk tur konumunu, ağaç yarısını ve eşleşme sırasını kesin olarak saklamak.
- BAY'ı oyuncu kaydı gibi taklit etmeden, açık bir eşleşme durumu/boş oyuncu alanıyla temsil etmek.
- BAY eşleşmelerini otomatik sonuçlandırmak.
- Haftalık `0–100` performans değerini güvenilir sunucu fonksiyonuyla hesaplamak.
- Kura ve skor hesaplarını idempotent yapmak.
- `get_bizimskor_cup` cevabına ağacı doğrudan kurmak için gereken alanları eklemek.

Önerilen API/RPC alanları:

| Alan | Amaç |
|---|---|
| `bracket_side` | `left` veya `right` |
| `bracket_position` | İlk turdaki 1–32 konumu |
| `seed_group` | `seeded`, `unseeded` veya `bye` |
| `seed_average` | Kura öncesi iki haftalık katılım ortalaması |
| `is_bye` | Kutunun BAY olduğunu açıkça belirtir |
| `performance_score` | Turun canlı/kesin 0–100 değeri |
| `score_final` | Haftanın tamamlanıp puanın kesinleştiğini belirtir |
| `source_match_id` | Sonraki tur oyuncusunun geldiği eşleşme |

Kesin kolon adları uygulama planında mevcut şemaya göre seçilebilir; ancak istemcinin eşleşme ilişkisini adlardan veya dizi sırasından tahmin etmemesi gerekir.

## 11. Güvenlik, Eşzamanlılık ve Hata Yönetimi

- Kura sunucuda, transaction ve uygun kilit altında yalnızca bir kez oluşturulur.
- Aynı anda birden fazla zamanlayıcı/yönetici çağrısı aynı sonucu çoğaltamaz.
- `N > 64` durumunda kura başlatılmaz ve yöneticiye açık hata verilir.
- Geçersiz oyuncu, eksik kayıt veya tutarsız tur bağlantısı sessizce atlanmaz; işlem rollback olur.
- Kura üretimi tamamlanmadan kısmi eşleşme verisi yayınlanmaz.
- Ön yüz RPC hatasında son başarılı ağacı korur ve tekrar deneme sunar.
- İstemci verisi kupa kazananını belirleyemez; tüm sonuçlar sunucuda hesaplanır.
- Sonuç düzeltmeleri aynı girdiden aynı ağacı/sonucu üretir.

## 12. Test Stratejisi

Uygulama test güdümlü geliştirilecektir. Önce aşağıdaki davranışları yakalayan başarısız testler yazılacak, sonra en küçük değişiklikle geçirilecektir.

### 12.1 Sunucu ve SQL sözleşme testleri

- 43, 44, 60, 63 ve 64 katılımcı ile kura.
- Tek sayıda katılımcı için doğru `ceil/floor` havuzları.
- 60 oyuncuda her havuzda 30 oyuncu + 2 BAY.
- Hiçbir koşulda BAY–BAY oluşmaması.
- Her gerçek oyuncunun yalnızca bir ilk tur yerinde bulunması.
- Her ilk tur konumunun yalnızca bir eşleşmeye ait olması.
- Bir referans haftasına katılan oyuncunun ortalamasının yalnız o hafta olması.
- İki haftaya katılan oyuncunun aritmetik ortalaması.
- Hiç katılmayan oyuncunun ortalamasının 0 olması.
- Seri başı eşitlik kuralının değişmemesi.
- Kuranın ikinci çağrıda yeniden üretilmemesi.
- BYE ile eşleşen oyuncunun otomatik ilerlemesi.
- Birinci/sonuncu/ara sıra ve tek katılımcı için performans formülü.
- Tahmin yapmayan kupa oyuncusunun 0 alması.
- Sonuç düzeltmesinin ilgili turu ve bağımlı sonraki turu tutarlı güncellemesi.

### 12.2 Ön yüz testleri

- Kura öncesinde 64 ilk tur kutusunun görünmesi.
- Sol ve sağ yarıda 16'şar ilk tur eşleşmesi.
- Kura açıklanırken doğru kutuların sırayla dolması.
- Sayfa yenilemesinde aynı yerleşimin korunması.
- BAY ve otomatik tur etiketleri.
- Canlı ve kesin performans puanı gösterimleri.
- Mobilde tur tur yatay kaydırma, `scroll-snap` ve aktif tur senkronizasyonu.
- Klavye ve ekran okuyucu etiketleri.
- `reduced motion` desteği.
- Mevcut kayıt, kura ve kupa sekmelerinin geriye dönük çalışması.

### 12.3 Uçtan uca doğrulama

- Kura öncesi kayıtlı kullanıcı ve misafir görünümü.
- Kura anı, bağlantı kopması ve yeniden giriş.
- Bir BAY oyuncusunun ikinci tura yerleşmesi.
- Canlı haftalık sıra değiştiğinde kupa puanının değişmesi.
- Hafta bitince kazananın kesinleşip doğru sonraki kutuya ilerlemesi.
- Mobil düşük performanslı cihazda kaydırma ve açılış süresi.

Mevcut test paketinde bu çalışmadan bağımsız, önceden bulunan bazı kırık testler vardır (`robot-prediction-ui`, `nations-week3-cache-bust`, `skorbot-branding`, `ui-integration-loader`). Yeni çalışmanın test sonucu raporlanırken bu başlangıç durumu ayrı gösterilecek; yeni değişiklik eski kırıkları gizlemeyecek ve yeni kırık eklemeyecektir.

## 13. Yayın ve Geri Alma

1. Şema/RPC migration'ı önce test ortamında uygulanır.
2. Mevcut kupa ve kayıt verileri salt okunur kontrol edilir.
3. Ön yüz, yeni alanlar yoksa eski görünümü güvenli biçimde gösterecek şekilde geriye uyumlu hazırlanır.
4. Migration canlı Supabase projesine uygulanır.
5. Ön yüz production'a alınır.
6. Kura öncesi boş ağaç, kayıt sayısı, iki havuz ve BYE sayısı gerçek veride doğrulanır.
7. Kura başlamadan önce örnek/salt okunur hesapla seri başı dağılımı kontrol edilir.

Geri alma gerektiğinde ön yüz önce eski kupa görünümüne döndürülebilir. Migration var olan tahmin ve sıralama verilerini silmez; yeni alanlar ekleyici olmalıdır. Kura oluşturulduktan sonra geri alma oyuncu eşleşmelerini değiştirmemelidir.

## 14. Kabul Kriterleri

Değişiklik aşağıdaki koşulların tamamında kabul edilir:

- Kupa ağacı kura öncesinde oyunda 64 yerli olarak görünür.
- Kura sonucu Son 64 panelinde 32 ilk tur eşleşmesi oluşturur.
- Her gerçek eşleşme bir seri başı ile bir seri başı olmayan havuz öğesinden gelir.
- Referans haftalardan yalnız birini oynayan kişinin ortalaması doğru hesaplanır.
- Katılımcı sayısı 64'ten az olduğunda BAY'lar dengeli dağılır ve BAY–BAY oluşmaz.
- Kura sırasında eşleşmeler ağacın gerçek kutularına yerleşir.
- Her panel seçili turdan bir sonraki tura giden bağlantıları gösterir ve Final paneli kupaya ulaşır.
- Eleme puanı haftalık resmî sıraya göre 100'den 0'a hesaplanır ve canlı güncellenir.
- Mevcut sıralama eşitlik kuralı değişmez.
- Mobilde kutular okunabilir, paneller tur tur kaydırılabilir ve aktif tur düğmesi kaydırmayla değişir.
- Kura ve sonuç işlemleri tekrar çağrıldığında kopya veya farklı sonuç üretmez.
- Kupa dışındaki tahmin, sıralama, Arena ve yönetici ekranlarında regresyon oluşmaz.


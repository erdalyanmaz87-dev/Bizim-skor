# Bizim Skor Ligleri — Güncel Tasarım Dokümanı

## Amaç
Bizim Skor'a sezon ortasında katılan oyuncuların da sürdürülebilir şekilde rekabet içinde kalmasını sağlayan, mevcut Süper Lig / Şampiyonlar Ligi / Uluslar Ligi sıralamalarını değiştirmeden çalışan ortak lig sistemi.

## İsim ve Arayüz
- Sistem adı: **Bizim Skor Ligleri**
- Oyuncu detay alanı: **Ligim**
- Beş kademe:
  1. Şampiyonlar
  2. Elit Lig
  3. Altın Lig
  4. Gümüş Lig
  5. Bronz Lig
- Yeni oyuncular Bronz Lig'den başlar.

## İlk Yerleştirme — Kesin Kural
İlk lig dağılımı yalnız aynı sezonun **Süper Lig 3. ve 4. haftaları** üzerinden yapılır.

Her hafta ayrı ayrı 0–100 normalize edilir. Oyuncu haftalardan birini eksiksiz tahmin etmediyse o hafta **0** kabul edilir. İlk yerleştirme puanı:

`(3. hafta normalize puanı + 4. hafta normalize puanı) / 2`

İlk yerleştirmede eşitlik sırası:
1. normalize başlangıç performansı,
2. daha fazla **benzersiz** oyuncu davet eden,
3. iki haftada daha fazla geçerli tur oynayan,
4. daha fazla tam skor bilen,
5. daha fazla ham puan alan,
6. oyuncu ID.

İlk yerleştirme puanı yalnız başlangıç ligi ve ilk görünür sıralama içindir. 5. hafta dönem performansı oluşmaya başladığında bu tarihsel başlangıç puanı taşınmaz.

## Dönem Yapısı
Bir lig dönemi takvimde sabit 28 gün değildir. **4 ardışık tamamlanmış Süper Lig haftası** bir dönemdir.

İlk dönem:
- Süper Lig 5. hafta
- 6. hafta
- 7. hafta
- 8. hafta

İkinci dönem 9–12, üçüncü dönem 13–16 şeklinde devam eder.

Şampiyonlar Ligi ve Uluslar Ligi turları dönem sayacını ilerletmez; ancak dönem zaman penceresi içinde tamamlanırlarsa ortak performansa dahil edilirler.

Dönem ancak hedeflenen dört Süper Lig haftasının bütün fikstürlerinin ev/deplasman skorları doluysa kapanabilir. Bir sonraki Süper Lig haftasının fikstürü yüklenmeden mevcut dönem kapatılmaz.

## Dönem İçi Performans
Her tamamlanmış resmi tahmin turu bağımsız değerlendirilir:
- Süper Lig haftası,
- Şampiyonlar Ligi turu,
- Uluslar Ligi turu.

Oyuncunun o turda geçerli sayılması için o turun bütün maçlarına tahmin girmiş olması gerekir. Katılmadığı veya eksik bıraktığı dönem içi tur **0 puan yazmaz**; ortalamaya hiç girmez.

Normalize formül:

`100 × (katılımcı_sayısı - sıra) / (katılımcı_sayısı - 1)`

- 1. sıra = 100
- son sıra = 0
- katılımcı sayısı 2'den azsa tur lig hesabına girmez.

Aynı turda ham puan + tam skor + doğru sonuç sayısı eşit olan oyuncular aynı `rank()` değerini ve aynı normalize puanı alır. İsim veya kayıt zamanı normalize tur puanını etkilemez.

Dönem performansı, oyuncunun oynadığı geçerli turların normalize puanlarının ortalamasıdır.

## Görünürlük ve 2 Tur Şartı
Herkes kendi lig tablosunda görünür. Oyuncunun 0 veya 1 geçerli turu olsa bile:
- lig adı,
- lig içi sıra,
- mevcut performans puanı
arayüzde gösterilir.

Ancak yükselme/düşme hareketine katılabilmek için dönem içinde en az **2 ayrı geçerli tahmin turu** tamamlamak gerekir.

2 tur şartını tamamlamayan oyuncu dönem sonunda:
- Şampiyonlar → Elit
- Elit → Altın
- Altın → Gümüş
- Gümüş → Bronz
- Bronz → Bronz
şeklinde otomatik bir kademe düşer.

Uygun olmayan oyuncu hiçbir durumda yalnız kontenjan doldurmak için yükseltilmez.

## Dönem İçi Eşitlik
Lig içi dönem performansı eşitse sırasıyla:
1. daha fazla **benzersiz davet edilen oyuncu**,
2. daha fazla geçerli tur,
3. daha fazla tam skor,
4. daha fazla ham puan,
5. oyuncu ID
kullanılır.

Davet sayısı `player_invites` içindeki benzersiz `invited_name` sayısıdır; aynı davetli mükerrer satıra düşerse bir kez sayılır.

## Lig Kapasiteleri
Dönem başındaki aktif oyuncu sayısına göre hedef dağılım:
- Şampiyonlar: %10
- Elit: %15
- Altın: %20
- Gümüş: %25
- Bronz: kalan

77 oyuncu için ilk dağılım:
- 8 Şampiyonlar
- 12 Elit
- 15 Altın
- 19 Gümüş
- 23 Bronz

Kapasiteler ve yükselme/düşme slotları dönem başında kilitlenir.

## Yükselme ve Düşme
Yükselme/düşme seçimi yalnız **uygun oyuncuların kendi aralarındaki eligible_rank** üzerinden yapılır. Tabloda üstte görünen fakat 2 tur şartını tamamlamayan oyuncular, uygun oyuncuların hareket sırasını bloke edemez.

Pasiflik nedeniyle normal kotadan fazla düşüş oluşursa alt ligden mümkün olduğu kadar ek uygun oyuncu yükseltilir. Ancak alt ligde yeterli uygun oyuncu yoksa, 2 tur kuralı kapasiteyi korumaktan daha önceliklidir; uygun olmayan oyuncu yükseltilmez.

## Otomatik Güncelleme
Saatlik bakım işi:
1. açık dönemi bulur,
2. dönem penceresi içindeki tamamlanmış Süper Lig / CL / Uluslar Ligi turlarını keşfeder,
3. yalnız bütün skorları dolu turları işler,
4. `league_round_performance` kayıtlarını UPSERT ile günceller,
5. lig üyelik ve sıralamalarını yeniler,
6. hedef dört ardışık Süper Lig haftası tamamlandığında ve sonraki hafta fikstürü hazır olduğunda dönem devrini yapar.

Aynı tur tekrar işlense bile mükerrer performans satırı oluşmaz.

## Arayüz
Ana sayfadaki lig özeti oyuncunun gerçek ligini ve sırasını her zaman gösterir. 2 tur şartı tamamlanmadıysa ayrıca kaç tur gerektiği belirtilir.

`Sıralamalar > Ligim` ekranında:
- oyuncunun bulunduğu lig varsayılan açılır,
- bütün lig oyuncuları görünür,
- oyuncunun kendi satırı belirgin olur,
- yükselme/düşme bölgeleri uygun oyuncular için gösterilir,
- diğer ligler chip/kartlardan görüntülenebilir,
- `Lig Kuralları` alanı güncel kuralları açıklar.

## Veri Modeli
### league_periods
Dönem, başlangıç/bitiş penceresi ve kilitli kapasite/slotlar.

### league_round_performance
- period_id
- player_id
- competition
- round_key
- participant_count
- rank
- performance_score
- exact_score_count
- raw_points

### league_memberships
- period_id
- player_id
- league_code
- starting_league_code
- is_eligible
- valid_round_count
- performance_score
- exact_score_count
- raw_points
- rank_in_league
- promotion_status

### league_history
Dönem kapanışındaki from/to league, sebep, final sıra ve final performans.

## İzolasyon
Bizim Skor Ligleri mevcut:
- Süper Lig sıralamasını,
- Şampiyonlar Ligi sıralamasını,
- Uluslar Ligi sıralamasını,
- Arkadaş Liglerini,
- canlı skor sistemini,
- bildirimleri,
- davet sisteminin mevcut davranışını
rewrite etmez. Yalnız mevcut tahmin/sonuç verisini okur ve kendi `league_*` tablolarına yazar.

## Production Kuralı
Feature branch'teki migrationlar production Supabase'e ayrıca açık onay verilmeden uygulanmaz. Production'a geçmeden önce SQL yürütme doğrulaması, UI regresyon kontrolü ve ilk 77 kişilik seed çıktısı tekrar kontrol edilir.

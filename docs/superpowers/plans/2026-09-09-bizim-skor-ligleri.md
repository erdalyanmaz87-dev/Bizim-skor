# Bizim Skor Ligleri — Güncel Uygulama Planı

**Branch:** `feature/invite-growth-v1`

**Production kuralı:** Açık kullanıcı onayı olmadan Supabase production migration uygulanmaz ve canlı lig sistemi açılmaz.

## Onaylanmış Davranış

- 5 lig: Şampiyonlar / Elit / Altın / Gümüş / Bronz.
- Yeni oyuncu Bronz başlar.
- İlk dağılım yalnız aynı sezon Süper Lig 3. ve 4. hafta üzerinden yapılır.
- İlk seed: eksik hafta = 0, iki haftanın normalize puanı / 2.
- İlk seed eşitliği: performans > benzersiz davet > oynanan tur > tam skor > ham puan > player ID.
- 5. haftadan itibaren ilk seed puanı taşınmaz; dönem performansı sıfırdan oluşur.
- Dönem = 4 ardışık tamamlanmış Süper Lig haftası. İlk dönem 5–8.
- CL ve Uluslar Ligi dönem sayacına girmez; dönem penceresindeki tamamlanmış turlar ortak performansa dahil edilir.
- Dönem içindeki katılmadığın tur 0 değildir; ortalamaya girmez.
- En az 2 geçerli tur yükselme/düşme uygunluğu için zorunludur.
- 2 tur şartını tamamlamayan oyuncu tabloda görünür fakat dönem sonunda bir alt lige düşer; Bronz Bronz'da kalır.
- Uygun olmayan oyuncu kontenjan doldurmak için yükseltilmez.
- Dönem içi eşitlik: performans > benzersiz davet > geçerli tur > tam skor > ham puan > player ID.
- Aynı turda ham puan + tam skor + doğru sonuç eşitse ortak `rank()` ve ortak normalize puan verilir.

## Tamamlanan Kod Parçaları

### Matematik ve veri modeli
- `league-system-utils.js`
- `supabase/migrations/20260909190000_bizim_skor_leagues.sql`
- normalize formül: `100 * (participantCount-rank)/(participantCount-1)`
- 77 oyuncu kapasitesi: 8 / 12 / 15 / 19 / 23
- `raw_points` tur ve üyelik tablolarında tutuluyor.

### Tur performansı
- `20260909193000_bizim_skor_league_rounds.sql`
- Süper Lig / CL / Uluslar Ligi adapterları
- eksiksiz tahmin şartı
- ortak tur derecesi için `rank()`
- idempotent UPSERT
- ham puan, tam skor ve normalize puan kaydı

### İlk yerleştirme
- `20260909204500_bizim_skor_league_initial_seed.sql`
- aynı sezon 3+4 hafta
- eksik hafta 0
- benzersiz davet sayısı eşitlik kriteri
- NULL sonuç skorları tamamlanmış sayılmaz

### Üyelik ve Ligim verisi
- `20260909200000_bizim_skor_league_memberships.sql`
- herkes tabloda görünür
- ilk gerçek dönem turu geldiğinde seed performansı temizlenir
- dönem performansı yalnız dönem turlarından hesaplanır
- eşitlikte benzersiz davet sayısı kullanılır
- canlı yükselme/düşme statüsü ve dönem kapanışı ortak `league_movement_plan` kullanır
- `get_my_league_summary`
- `get_league_table`

### Dönem kapanışı
- `20260909205000_bizim_skor_league_inactivity_relegation.sql`
- 2 tur şartını tamamlamayan otomatik bir kademe düşer
- Bronz aşağı düşmez
- hareket seçiminde yalnız uygun oyuncular için `eligible_rank` üretilir
- pasif oyuncular uygun oyuncuların yükselme sırasını bloke etmez
- orta ligde aynı uygun oyuncu hem yükselme hem düşme grubuna giremez
- kapanış idempotenttir

### Sonraki dönem
- `20260909210000_bizim_skor_league_next_period.sql`
- önceki `league_history.to_league` yeni başlangıç ligi olur
- yeni oyuncu Bronz başlar

### Otomasyon
- `20260909210500_bizim_skor_league_round_auto_refresh.sql`
- dönem otomasyonundan önce kurulur
- saatlik açık dönem tur keşfi
- üç organizasyon
- yalnız tüm ev/deplasman skorları dolu turlar
- dönem penceresi dışındaki tur işlenmez

- `20260909211000_bizim_skor_league_period_automation.sql`
- yalnız 4 ardışık Süper Lig haftası sayılır
- sonuç skorları NULL ise hafta tamamlanmış sayılmaz
- bir sonraki hafta fikstürü yüklenmeden dönem kapatılmaz
- sonraki dönem tam olarak +4 Süper Lig haftasından başlar

### UI
- `league-system-ui.js`
- `Ligim` özeti
- oyuncu uygun olmasa bile lig/sıra/puan görünür
- 2 tur uyarısı yalnız oyuncunun kendi ligi görüntülenirken gösterilir
- diğer ligleri görüntüleme
- kurallar paneli
- mevcut genel sıralama akışına izole entegrasyon

## Doğrulama Durumu

- [x] Lig testleri için izole GitHub Actions workflow'u eklendi.
- [x] Son tam doğrulanmış koşuda 62/62 test geçti, 0 hata.
- [x] 77 oyunculuk ilk seed yeni ortak-rank ve benzersiz davet mantığıyla production verisi üzerinde read-only olarak tekrar hesaplandı; lig sınırları kontrol edildi.
- [x] Otomatik tur yenileme migration'ı dönem otomasyonundan önce gelecek şekilde sıralandı.
- [x] Vercel build kontrollerinde başarılı koşular görüldü.

## Kalan İşler — Production Öncesi

- [ ] Son UI düzeltmesinden sonraki GitHub Actions koşusunun yeşil olduğunu doğrulama.
- [ ] Tüm migrationların gerçek PostgreSQL üzerinde development/staging yürütme doğrulaması.
- [ ] Yükselme/düşme kapanışını temsili veriyle gerçek SQL seviyesinde simüle etme.
- [ ] Yeni dönem açılışında lig boyutlarını ve uygun oyuncu yetersizliği kenar durumunu gerçek SQL ile doğrulama.
- [ ] UI regresyon kontrolü: Süper Lig / CL / Uluslar Ligi / Arkadaş Ligleri / canlı skor / bildirim / davet sistemi etkilenmiyor.
- [ ] Production migration sırasını son kez tek tek kontrol etme.
- [ ] Kullanıcıdan production için ayrıca açık onay alma.

## Doğrulama İlkesi

Bir adım yalnız dosyanın yazılmış olmasıyla “tamam” sayılmaz. Production öncesinde en az:
- statik sözleşme testleri,
- gerçek Postgres SQL doğrulaması,
- UI/build kontrolü,
- seed veri kontrolü
birlikte görülmelidir.

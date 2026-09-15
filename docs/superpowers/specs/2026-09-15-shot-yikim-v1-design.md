# Şut Yıkım v1 — Tasarım

Tarih: 2026-09-15
Branch: `feature/shot-yikim-v1`

## Amaç

Şut Yıkım, Bizim Skor'dan bağımsız bir oyun olarak geliştirilecek. İlk sürümün amacı, production akışlarına dokunmadan oynanabilir bir temel oluşturmak ve sonraki sürümlerde hedef/yıkım mekaniği, bölüm sistemi, puanlama ve kalıcı oyuncu verilerinin eklenebileceği temiz bir yapı kurmaktır.

## Kapsam

İlk sürüm aşağıdaki parçaları içerir:

- Bizim Skor ekranlarından ve mevcut oyun akışlarından ayrılmış bağımsız Şut Yıkım giriş noktası.
- Mobil öncelikli oyun ekranı.
- Oyun alanı, top, hedef/yıkılabilir bloklar ve temel HUD.
- Oyuncunun nişan alıp şut başlatabildiği temel etkileşim.
- Şut sonucunda hedefe isabet, hedefin hasar/yıkım durumu ve puan güncellemesi.
- Tur/oyun durumu: hazır, oynanıyor, tur tamamlandı, oyun bitti.
- Yeniden başlatma akışı.
- Temel oyun mantığının DOM'dan ayrılması ve test edilebilir saf fonksiyonlar.

## İlk sürümde kapsam dışı

- Bizim Skor kullanıcı hesaplarıyla entegrasyon.
- Supabase veya başka bir kalıcı veri katmanı.
- Global liderlik tablosu.
- Çok oyunculu mod.
- Ödül, mağaza, reklam veya satın alma sistemi.
- Production ana sayfasına bağlantı eklenmesi.

Bu özellikler, temel oyun döngüsü doğrulandıktan sonra ayrı sürümlerde ele alınacaktır.

## Mimari

Şut Yıkım, repo içinde ayrı bir `shot-yikim/` klasöründe tutulacaktır. Böylece mevcut Bizim Skor kodu ile ortak global değişken, stil veya DOM bağımlılığı oluşturulmaz.

Önerilen yapı:

```text
shot-yikim/
  index.html
  shot-yikim.css
  shot-yikim.js
  shot-yikim-engine.js
  shot-yikim-engine.test.js
```

### `index.html`

Yalnızca Şut Yıkım ekranının iskeletini barındırır. Oyun alanı, HUD, başlat/yeniden başlat kontrolleri ve erişilebilir açıklamalar burada yer alır.

### `shot-yikim.css`

Mobil öncelikli görünüm, oyun alanı yerleşimi, top/hedef görselleri, durum animasyonları ve koyu/açık ortamda okunabilirlik burada tutulur. Stiller `.shot-yikim` kök sınıfı altında scope edilir.

### `shot-yikim-engine.js`

DOM'dan bağımsız oyun kuralları burada tutulur. Temel sorumluluklar:

- Başlangıç oyun durumunu üretmek.
- Şut girdisini doğrulamak.
- Atış parametrelerini hesaplamak.
- Hedef çarpışmasını değerlendirmek.
- Hasar ve yıkım sonucunu uygulamak.
- Puanı güncellemek.
- Turun bitip bitmediğini belirlemek.

Bu dosya test edilebilir saf fonksiyonlar içerecektir.

### `shot-yikim.js`

UI ile oyun motoru arasındaki adaptördür. Pointer/touch olaylarını dinler, oyun motorunu çağırır ve sonucu DOM'a yansıtır. Oyun kurallarını burada tekrar etmez.

## Oyun döngüsü

1. Oyun `ready` durumunda açılır.
2. Oyuncu oyun alanında nişan yönünü ve şut gücünü belirler.
3. Şut başlatıldığında durum `playing` olur.
4. Topun hedefle teması hesaplanır.
5. İsabet varsa hedefin dayanıklılığı azaltılır; sıfıra düşen hedef yıkılır.
6. İsabet/yıkım sonucuna göre puan eklenir.
7. Sahadaki bütün hedefler yıkılmışsa tur `round-complete` olur.
8. Şut hakkı kalmamış ve hedefler duruyorsa durum `game-over` olur.
9. Oyuncu yeniden başlatabilir.

## İlk denge değerleri

İlk iskelet için değerler sabit ve kolay değiştirilebilir sabitler olarak tutulacaktır:

- 3 hedef.
- Her hedef 1 dayanıklılık puanı.
- 5 şut hakkı.
- İsabet: 100 puan.
- Hedef yıkma bonusu: 150 puan.
- Tüm hedefleri bitirme bonusu: 300 puan.

Bu değerler oyun hissi test edildikten sonra değiştirilebilir; motor içinde dağınık sabitler olarak kullanılmayacaktır.

## Girdi modeli

Mobil öncelik nedeniyle Pointer Events kullanılacaktır. Aynı akış mouse ve touch girişini destekleyecektir.

İlk sürümde karmaşık gerçek zamanlı fizik yerine kontrollü bir şut modeli kullanılacaktır: oyuncunun başlangıç noktası ile bıraktığı nokta arasındaki vektör yön ve güç üretir. Motor bu vektör ile hedef alanını değerlendirir. Görsel animasyon UI katmanında yapılır; skor/yıkım kararı motor katmanında tek kaynaktan çıkar.

Bu tercih ilk sürümü hızlı, test edilebilir ve cihazlar arasında tutarlı yapar. Daha gerçekçi fizik gerekirse sonraki sürümde motor değiştirilebilir.

## Durum modeli

Temel oyun durumu aşağıdaki bilgileri taşır:

```js
{
  status: 'ready' | 'playing' | 'round-complete' | 'game-over',
  score: 0,
  shotsRemaining: 5,
  targets: [
    { id, x, y, radius, hp, destroyed }
  ],
  lastShot: null
}
```

UI yalnızca bu durumun görünümüdür; skor veya hedef durumu DOM üzerinde ayrı bir gerçeklik olarak tutulmaz.

## Hata ve sınır durumları

- Oyun alanı dışında başlayan girişler yok sayılır.
- Gücü sıfıra çok yakın şutlar geçersiz sayılır ve şut hakkı tüketmez.
- Tur bittikten sonra yeni şut kabul edilmez.
- Aynı şut bir hedefi yalnızca bir kez etkiler.
- Yeniden başlatma tüm runtime durumunu başlangıç değerlerine döndürür.
- Ekran yeniden boyutlandığında oyun alanı oranı korunur; mantıksal hedef koordinatları normalize edilir.

## Test stratejisi

İlk sürümde motor için en az şu testler bulunacaktır:

- Başlangıç durumu doğru oluşturuluyor.
- Geçersiz şut şut hakkını tüketmiyor.
- Geçerli şut şut hakkını azaltıyor.
- İsabet hedef HP'sini azaltıyor.
- Hedef sıfır HP'de yıkılmış işaretleniyor.
- İsabet ve yıkım puanları doğru hesaplanıyor.
- Son hedef yıkıldığında tur tamamlanıyor.
- Şut hakkı bitip hedef kaldığında oyun bitiyor.
- Reset başlangıç durumunu geri getiriyor.

UI tarafında kritik DOM bağlantıları için hafif smoke test uygulanacaktır. Production/main branch üzerinde hiçbir değişiklik yapılmayacaktır.

## Başarı ölçütü

v1 tamamlandığında kullanıcı telefonda Şut Yıkım ekranını açabilmeli, parmakla nişan alıp şut atabilmeli, hedefleri vurup yıkabilmeli, skor ve kalan şut sayısını görebilmeli ve turu yeniden başlatabilmelidir. Oyun kodu Bizim Skor'un mevcut ekranlarını, stillerini veya verisini değiştirmemelidir.

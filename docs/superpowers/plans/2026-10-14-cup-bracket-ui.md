# BizimSkor Kupası Maçkolik Tipi Ağaç Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kupa Ağacı sekmesinde kura öncesinde de görünen, Maçkolik örneğindeki gibi tur tur yatay kaydırılan ve eşleşmeleri mavi çizgilerle sonraki tura bağlayan 64 kişilik turnuva ağacını oluşturmak.

**Architecture:** Mevcut `cup-ui.js` sunucu verisi değiştirilmeden altı yatay tur paneline dönüştürülecek. Her panel mevcut turu solda, sonraki turu sağda ve aradaki bağlantıları gösterecek; Final paneli kupayla bitecek. Mobil `scroll-snap`, üst tur düğmeleri ve kaydırma konumu çift yönlü eşzamanlanacak.

**Tech Stack:** Vanilla JavaScript, HTML template strings, CSS Grid/Flexbox, CSS scroll-snap, Node.js built-in test runner

**Spec:** `docs/superpowers/specs/2026-10-14-bizimskor-cup-bracket-design.md`

## Global Constraints

- Kupa dışındaki tahmin, sıralama, Arena ve yönetici ekranlarına dokunulmayacak.
- Son 64 panelinde kura öncesinde 32 eşleşme ve 64 `Kura bekleniyor` oyuncu yeri bulunacak.
- Paneller Son 64 → Son 32 → Son 16 → Çeyrek Final → Yarı Final → Final sırasıyla ilerleyecek.
- Her panel mevcut tur ile bir sonraki turu ve mavi bağlantı çizgilerini gösterecek.
- Final panelinde final eşleşmesinin sağında kupa bulunacak.
- Mevcut `get_bizimskor_cup` cevabındaki `round` ve `position` alanları kullanılacak; backend alanı zorunlu olmayacak.
- Mobilde yatay kaydırma tur paneline oturacak; yakınlaştırma düğmesi olmayacak.
- Başvuru, Canlı Kura, ödül ve yönetici bölümleri değişmeden çalışacak.

## Review Focus

- Boş veya kısmi `matches` dizisi bütün bekleyen yuvaları çizmelidir (Task 1).
- `round/position` eşleşmeleri canlı yenilemede başka kutuya taşınmamalıdır (Task 1).
- Son 64'te 32 eşleşmenin uzun dikey listesi yatay kaydırmayı bozmamalıdır (Task 2).
- Kullanıcı kaydırırken aktif tur düğmesi, düğmeye basarken panel konumu doğru değişmelidir (Task 3).
- Otomatik veri yenilemesi kullanıcının bulunduğu turu başa döndürmemelidir (Task 3).

---

### Task 1: Altı Tur Panelinin Saf Renderı

**Files:**
- Modify: `cup-ui.js`
- Create: `test/cup-bracket-ui.test.js`

**Interfaces:**
- Consumes: `{ start_week, matches[] }` ve `{ round, position, name_a, name_b, points_a, points_b, winner, bronze }`.
- Produces: `bracket(state): string`, `bracketStage(state, round): string`, `bracketMatch(state, round, position, role): string`; `.bsc-bracket-stage[data-stage]` panelleri.

- [ ] **Step 1: Başarısız render testlerini yaz**

`test/cup-bracket-ui.test.js` şu testleri içersin:

- `renders six ordered stage panels`: `data-stage="1"`–`data-stage="6"` sırasını doğrula.
- `renders 32 first-round matches and 64 waiting players before draw`: boş `matches` ile sayıları doğrula.
- `maps round positions without moving partial draw results`: 1. ve 32. pozisyon adlarını doğru yuvalarda doğrula.
- `shows current and next round in each non-final panel`: 1. panelde 32 mevcut + 16 hedef, 2. panelde 16 mevcut + 8 hedef kartı doğrula.
- `renders final with trophy`: 6. panelde final kartını ve `.bsc-bracket-trophy` öğesini doğrula.
- `escapes player names`: HTML içeren adın çalıştırılabilir işaretleme olarak çıkmadığını doğrula.

- [ ] **Step 2: Testin doğru nedenle başarısız olduğunu doğrula**

Run: `node --test test/cup-bracket-ui.test.js`

Expected: FAIL; `cup.bracket is not a function`.

- [ ] **Step 3: Saf render yardımcılarını uygula**

`cup-ui.js` içine şu imzaları ekle:

- `matchAt(state, round, position): object`
- `bracketPlayer(name, points, fallback, winner): string`
- `bracketMatch(state, round, position, role): string`
- `bracketStage(state, round): string`
- `bracket(state): string`

Bir sonraki tur kutusu, kendisini besleyen iki mevcut tur eşleşmesinin ortasında konumlanabilmesi için `data-source-start` ve `data-source-end` niteliklerini taşısın. Eksik oyuncu adında ilk tur için `Kura bekleniyor`, sonraki turlar için kaynak eşleşme galibi metni kullanılsın.

- [ ] **Step 4: Kupa Ağacı sekmesini `bracket(state)` çıktısına bağla**

Eski kura öncesi tek paragrafı, tur kart gridini ve iç içe `details` ağacını kaldır. `rewardPodium(state)` çıktısını ağacın altında koru. `bracket` fonksiyonunu CommonJS dönüş nesnesinde dışa aktar.

- [ ] **Step 5: Testleri çalıştır**

Run: `node --test test/cup-bracket-ui.test.js test/cup-joined-status.test.js`

Expected: Tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add cup-ui.js test/cup-bracket-ui.test.js
git commit -m "feat: render six-stage cup bracket"
```

### Task 2: Maçkolik Tipi Kartlar ve Bağlantı Çizgileri

**Files:**
- Modify: `cup-ui.css`
- Modify: `test/cup-bracket-ui.test.js`

**Interfaces:**
- Consumes: Task 1 `.bsc-bracket-*` DOM sınıfları ve veri nitelikleri.
- Produces: Ekran genişliğinde kayan paneller, iki kolonlu eşleşme düzeni, mavi dirsekli bağlantılar ve final kupası.

- [ ] **Step 1: CSS sözleşmesi için başarısız test yaz**

Test şunları doğrulasın:

- `.bsc-bracket-viewport` üzerinde `overflow-x:auto` ve `scroll-snap-type:x mandatory`
- `.bsc-bracket-stage` üzerinde `scroll-snap-align:start`
- mevcut ve sonraki tur kolonları için ayrı seçiciler
- bağlantılar için mavi kenarlık/pseudo-element seçicileri
- `.bsc-bracket-trophy` stili
- `prefers-reduced-motion:reduce` kuralı

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `node --test test/cup-bracket-ui.test.js`

Expected: FAIL; yeni CSS kuralları bulunamaz.

- [ ] **Step 3: Tur paneli ve eşleşme kartı stillerini uygula**

Her panel viewport genişliğinde olsun. Mevcut tur kartları solda, hedef tur kartları sağda yer alsın. İki kaynak kartın çizgileri birleşerek hedef karta ulaşsın. Kartlar koyu zeminli, yuvarlatılmış; puanlar sağda; kazanan metin ve `✓` ile belirgin olsun. Son 64 paneli uzun dikey kaydırmaya izin versin.

- [ ] **Step 4: Mobil davranış ve erişilebilirlik stillerini uygula**

Yatay kaydırma momentumlu olsun, fakat dikey sayfa kaydırmasını engellemesin. Tur paneli ekrana otursun. Yakınlaştırma kontrolü eklenmesin. Azaltılmış hareket tercihinde yumuşak kaydırma kapansın.

- [ ] **Step 5: Testleri çalıştır ve commit et**

Run: `node --test test/cup-bracket-ui.test.js test/cup-joined-status.test.js`

Expected: Tüm testler PASS.

```bash
git add cup-ui.css test/cup-bracket-ui.test.js
git commit -m "style: add match-linked scrolling cup tree"
```

### Task 3: Tur Düğmesi ve Kaydırma Senkronizasyonu

**Files:**
- Modify: `cup-ui.js`
- Modify: `test/cup-bracket-ui.test.js`

**Interfaces:**
- Consumes: Task 1 altı paneli ve mevcut `round` modül durumu.
- Produces: `[data-cup-round]` düğmesi → panel kaydırma; panel kaydırma → aktif düğme; `syncBracketRound(viewport): number`.

- [ ] **Step 1: Tur kontrolleri için başarısız testleri yaz**

- Altı tur düğmesinin sıra ve etiketleri doğru olmalı.
- Aktif düğme `aria-pressed="true"` taşımalı.
- Her düğmenin `aria-controls="bscBracketStage-N"` değeri olmalı.
- Her panel eşleşen `id` ve `aria-labelledby` değerlerini taşımalı.

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `node --test test/cup-bracket-ui.test.js`

Expected: FAIL; panel/düğme ARIA bağlantıları eksik.

- [ ] **Step 3: Düğmeden panele geçişi uygula**

`[data-cup-round]` tıklamasında `round` güncellensin; ilgili panel `scrollIntoView({ behavior:'smooth', inline:'start', block:'nearest' })` ile açılsın. Render gerektirmeyen bu işlem, mevcut kaydırma konumunu kaybetmemeli.

- [ ] **Step 4: Panelden düğmeye senkronizasyonu uygula**

Viewport `scroll` olayını `requestAnimationFrame` ile sınırla. `Math.round(scrollLeft / clientWidth) + 1` ile görünür turu belirle; `round` ve `aria-pressed` değerlerini güncelle. Yenileme sonrası aynı turun panelini anlık olarak geri getir.

- [ ] **Step 5: Regresyon testlerini çalıştır ve commit et**

Run: `node --check cup-ui.js && node --test test/cup-*.test.js`

Expected: Tüm kupa testleri PASS.

```bash
git add cup-ui.js test/cup-bracket-ui.test.js
git commit -m "feat: sync cup rounds with horizontal swipe"
```

### Task 4: Cache-Bust ve Yayın Öncesi Doğrulama

**Files:**
- Modify: `ui-integration-loader.js`
- Modify: `cup-ui.js`

**Interfaces:**
- Consumes: Task 1–3 tamamlanmış ön yüz.
- Produces: Tarayıcıların yeni JS/CSS sürümünü almasını sağlayan `20261014-cup-bracket-v1` cache-bust.

- [ ] **Step 1: Aktif yükleme noktalarını güncelle**

`ui-integration-loader.js` içindeki `ASSET_VERSION` sonuna `-cup-bracket-v1` ekle. `cup-ui.js` içindeki stil URL'sini `cup-ui.css?v=20261014-cup-bracket-v1` yap.

- [ ] **Step 2: Statik ve kupa testlerini çalıştır**

Run: `git diff --check && node --check cup-ui.js && node --test test/cup-*.test.js`

Expected: Sıfır çıkış kodu ve tüm kupa testleri PASS.

- [ ] **Step 3: Tarayıcıda görsel doğrulama yap**

Şunları kontrol et:

- Son 64'te 32 boş eşleşme ve 64 bekleyen oyuncu,
- yatay sürüklemede sırayla altı tur,
- aktif tur düğmesinin kaydırmayla değişmesi,
- iki eşleşmeden sonraki tek eşleşmeye giden mavi çizgiler,
- Final kartının sağındaki kupa,
- Başvuru ve Canlı Kura sekmelerinin değişmeden çalışması.

- [ ] **Step 4: Commit**

```bash
git add cup-ui.js ui-integration-loader.js
git commit -m "chore: ship scrolling cup bracket assets"
```


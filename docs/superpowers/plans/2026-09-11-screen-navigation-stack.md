# Bizim Skor Screen Navigation Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ana Sayfa dışındaki tüm Bizim Skor menülerini ayrı ekran hissi veren ortak bir gezinme katmanına taşımak ve `← Geri` davranışını gerçek önceki ekran geçmişine bağlamak.

**Architecture:** Mevcut tek sayfalık uygulama korunacak. Yeni `screen-navigation.js` ve `screen-navigation-ui.js` katmanı mevcut tab/kart tıklamalarını izleyip görünürlük, ekran başlığı, History API ve scroll geri yükleme davranışını yönetecek. Mevcut RPC, tahmin, puanlama, canlı skor ve sıralama mantıkları değiştirilmeden kullanılacak.

**Spec:** `docs/superpowers/specs/2026-09-11-screen-navigation-stack-design.md`

## Global Constraints
- Ana Sayfa kök ekran.
- Geri gerçek bir önceki ekranı açar.
- Bütün mevcut menüler kapsanır; yeni menü eklenirse audit testi bunu yakalar.
- Oyuncu profili ve diğer detaylar stack'te ikinci seviye olur.
- Scroll konumu korunur.
- Kaydedilmemiş tahmin uyarısı korunur.
- Erdal Gelen Kutusu ayrı ekran ve yalnız yetkili Erdal'a görünür.
- Production'a explicit kullanıcı onayı olmadan geçilmez.

### Task 1 — Navigation Core
Create `screen-navigation.js` + `screen-navigation.test.js`.
TDD ile `createNavigationState`, `pushScreen`, `popScreen`, `currentScreen`, `rememberScroll` fonksiyonlarını ekle. `home` root fallback olsun. Test: `home → general → player → back = general → back = home` ve scroll saklama.

### Task 2 — Tam Menü Registry
`screen-navigation.js` içine registry ekle. En az şu id'leri kapsa: `pred`, `arena`, `championsRanking`, `nationsRanking`, `general`, `weeklyRankings`, `resultsWeek`, `footballCenter`, `friendLeagues`, `history`, `rules`, `chat`, `championsPred`, `nationsPred`, `supportPlayer`, `supportAdmin`. `horizontal-menu.js` görünür menü listesiyle audit testi yap; herhangi biri eksikse test FAIL.

### Task 3 — Full-Screen UI Shell
Create `screen-navigation-ui.js`, `screen-navigation.css`, tests. Ortak görünüm: sticky `← Geri`, başlık, tek içerik alanı. Ana menü ve diğer section'lar child ekranda görünmesin. iOS safe-area ve mobil viewport korunmalı.

### Task 4 — Existing Tab Adapter
Mevcut `.tab[data-tab]` handler'larını silme/değiştirme. Event sonrasında mevcut section yükleme tamamlanırken navigation katmanı seçili section'ı ekran kabuğuna taşısın/göstersin. `preventDefault` ile mevcut veri akışını bozma. Test mevcut handler'ın hâlâ çağrıldığını doğrulasın.

### Task 5 — Back + History + Scroll
History API ile her child ekran için bir state tut. Uygulama geri düğmesi ve browser/PWA back aynı stack'i kullansın. Popstate yalnız bir kez pop etsin. Ekrandan çıkarken `scrollY` sakla; geri gelince restore et. Test nested history ve scroll.

### Task 6 — Oyuncu Profili
`player-profile.js` yalnız presentation/navigation hook açısından güncellensin. Profil RPC ve model/render koduna dokunma. Sıralama → oyuncu → geri = aynı sıralama ve aynı scroll. Profil × düğmesi de stack pop davranışı kullansın.

### Task 7 — Kaydedilmemiş Tahmin Guard
Mevcut tahmin input değişiklik kontrolünü navigation çıkışına bağla. Geri/başka ekran/Ana Sayfa hareketinde kaydedilmemiş tahmin varsa mevcut uyarı gösterilsin; iptal edilirse stack değişmesin.

### Task 8 — Arkadaş Ligi Context
`friendLeagues` ekranında seçili `league_id`, hafta ve scroll context'i frame içinde sakla. Alt görünüm/oyuncudan geri dönünce aynı lig ve aynı hafta geri gelsin. Mevcut friend league RPC'lerine dokunma.

### Task 9 — Support Screens + Erdal Gelen Kutusu
`Bize Ulaşın` ve `Gelen Kutusu` modal/aşağı açılım yerine navigation screen olarak açılabilsin. Mevcut API/controller/backend aynen kalsın. Ana Sayfa'ya Erdal-only `📬 Gelen Kutusu` kartı ekle; görünürlük yalnız `adminApi.isAdmin()` başarılıysa. Diğer oyuncular kartı görmesin.

### Task 10 — Loader
`ui-integration-loader.js` içine navigation modüllerini `player-profile.js` ve `support-entry.js` öncesine ekle. Loader-order testi yaz.

### Task 11 — Regression/Audit
Run affected tests with `node --test screen-navigation*.test.js player-profile*.test.js support-*.test.js home-*.test.js horizontal-menu*.test.js`. Ayrıca doğrudan `classList.remove('hide')` ile primary screen açan kodları audit et; yalnız primary navigation bypass'larını adapter'a bağla, iç component visibility'ye dokunma.

### Task 12 — Preview Gate
İzole feature branch kullan. Vercel preview READY + build zero errors doğrula. Mobil smoke checklist: Tahmin Yap, Arena, iki kupa sıralaması ve tahmin ekranları, Süper Lig genel/haftalık, Fikstür, Futbol Merkezi, Arkadaş Ligleri, Geçmiş, Kurallar, Sohbet, Bize Ulaşın, Erdal Gelen Kutusu. Nested back testleri ve scroll restore testleri zorunlu. Production kullanıcı onayı olmadan merge edilmez.

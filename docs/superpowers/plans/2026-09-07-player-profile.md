# Player Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sıralamalardaki oyuncu adına dokununca güvenli, güncel durum ve başlamış maç tahminleri profili açmak.

**Architecture:** Token korumalı bir Supabase RPC oyuncu özetini ve maç satırlarını üretir; başlamamış rakip tahminlerini SQL katmanında `null` döndürür. Bağımsız bir tarayıcı modülü sıralama tablolarını olay delegasyonu ile dinler ve tek bir erişilebilir modalda profili gösterir.

**Tech Stack:** Vanilla JavaScript, Node test runner, Supabase PostgreSQL migrations.

**Spec:** Kullanıcının 7 Eylül 2026 tarihinde onayladığı oyuncu profili tasarımı.

## Global Constraints

- Başlamamış maç tahminleri başka oyunculara veritabanından dönmeyecek.
- Profil tüm puan sıralaması tablolarından açılacak.
- Mevcut sıralama hesapları ve çalışan ekranlar değiştirilmeyecek.
- Canlıya kullanıcı onayı olmadan geçilmeyecek.

---

### Task 1: Güvenli profil veri sözleşmesi

**Files:**
- Create: `supabase/migrations/20260907130000_player_profile.sql`
- Test: `test/player-profile-database-contract.test.js`

**Interfaces:**
- Consumes: `friend_session_player(text)`, `fixtures`, `predictions`, `results`, `players`.
- Produces: `get_player_public_profile(text,text)`.

- [x] RPC sözleşmesi, oturum doğrulaması ve maç başlamadan tahmin gizleme testini yaz.
- [x] Testi çalıştırıp eksik migration nedeniyle başarısız olduğunu doğrula.
- [x] Haftalık özet, genel/Sezu/Şampiyonlar Ligi sırası ve güvenli maç satırlarını döndüren RPC’yi ekle.
- [x] Veritabanı sözleşme testini çalıştır.

### Task 2: Oyuncu profil arayüzü

**Files:**
- Create: `player-profile.js`
- Test: `player-profile.test.js`
- Modify: `ui-integration-loader.js`
- Modify: `ui-integration-loader.test.js`

**Interfaces:**
- Consumes: `get_player_public_profile` RPC sonucu ve sıralama tablo satırları.
- Produces: `BizimSkorPlayerProfile.mount()`, `openProfile(name)`, profil HTML'i.

- [x] Profil modeli, güvenli görünürlük, 🎯/⚽ işaretleri ve oyuncu-adı düğmesi testlerini yaz.
- [x] Testi çalıştırıp modül eksikliği nedeniyle başarısız olduğunu doğrula.
- [x] Modal, yükleme/hata durumu ve sıralama tablosu olay delegasyonunu uygula.
- [x] Modül ve loader testlerini çalıştır.

### Task 3: Regresyon ve Preview doğrulaması

**Files:**
- Modify only if a feature-owned defect is found.

**Interfaces:**
- Consumes: Task 1–2 outputs.
- Produces: doğrulanmış Preview adayı.

- [x] Yeni özellik testlerini ve ilgili sıralama testlerini çalıştır.
- [x] Tam test paketindeki önceden var olan hatalar ile yeni hataları ayır.
- [x] Değişiklik farkını, güvenlik koşullarını ve tarayıcı davranışını denetle.
- [ ] Commit oluşturup Preview dağıtımını doğrula; production’a geçme.

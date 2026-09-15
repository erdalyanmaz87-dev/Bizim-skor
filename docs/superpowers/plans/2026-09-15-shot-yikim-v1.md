# Şut Yıkım v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobil öncelikli, Bizim Skor'dan izole çalışan, oyuncunun parmak/mouse ile şut yönü ve gücü belirleyerek üç hedefi yıkabildiği oynanabilir Şut Yıkım v1 temelini oluşturmak.

**Architecture:** Oyun `shot-yikim/` klasöründe tamamen izole tutulur. Saf oyun kuralları `shot-yikim-engine.js` içinde CommonJS + browser uyumlu bir modül olarak çalışır; `shot-yikim.js` Pointer Events ile UI girdisini motora çevirir ve state'i DOM'a render eder. HTML/CSS yalnız bu modülün görünümünü sağlar ve mevcut Bizim Skor dosyaları değiştirilmez.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Pointer Events, Node.js built-in `node:test` ve `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-09-15-shot-yikim-v1-design.md`

## Global Constraints

- Yalnızca `feature/shot-yikim-v1` branch'i değiştirilecek; `main` ve production'a dokunulmayacak.
- Şut Yıkım kodu `shot-yikim/` altında izole tutulacak.
- Bizim Skor kullanıcı hesapları, Supabase, liderlik tablosu, çok oyunculu, mağaza/reklam/ödül sistemi v1 kapsamı dışında kalacak.
- Başlangıç dengesi: 3 hedef, hedef başına 1 HP, 5 şut, isabet 100 puan, hedef yıkma bonusu 150 puan, tur bitirme bonusu 300 puan.
- Oyun durumları yalnızca `ready`, `playing`, `round-complete`, `game-over` olacak.
- 0'a çok yakın güçte şut geçersiz olacak ve şut hakkı tüketmeyecek.
- Mantıksal hedef koordinatları normalize (0..1) tutulacak; ekran boyutu oyun kuralını değiştirmeyecek.
- UI state'in tek kaynağı olmayacak; skor, kalan şut ve hedef durumu motor state'inden render edilecek.

---

## File Structure

- Create: `shot-yikim/shot-yikim-engine.js` — state üretimi, şut doğrulama, çizgi-hedef çarpışması, puanlama, tur/oyun sonu.
- Create: `shot-yikim/shot-yikim-engine.test.js` — motorun TDD testleri.
- Create: `shot-yikim/index.html` — bağımsız oyun sayfası ve erişilebilir UI iskeleti.
- Create: `shot-yikim/shot-yikim.css` — `.shot-yikim` scope'u altında mobil öncelikli görünüm ve animasyon durumları.
- Create: `shot-yikim/shot-yikim.js` — Pointer Events, aim preview, motor çağrısı, render ve reset.
- Create: `shot-yikim/shot-yikim-ui.test.js` — HTML/CSS/JS bağlantı ve kritik UI sözleşmesi smoke testleri.

### Task 1: Saf oyun motoru

**Files:**
- Create: `shot-yikim/shot-yikim-engine.test.js`
- Create: `shot-yikim/shot-yikim-engine.js`

**Interfaces:**
- Consumes: hiçbir repo içi modül yok.
- Produces: `CONFIG`, `createInitialState()`, `isValidShot(shot)`, `resolveShot(state, shot)`, `resetGame()`, `lineHitsTarget(shot, target)`.
- `shot` shape: `{ start:{x:number,y:number}, end:{x:number,y:number} }`, koordinatlar normalize `0..1`.
- `resolveShot()` shape: `{ state, result }`; `result` `{ valid:boolean, hitTargetId:string|null, destroyedTargetId:string|null }`.

- [ ] **Step 1: Başlangıç durumu ve geçersiz şut testlerini yaz**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('./shot-yikim-engine.js');

test('initial state uses approved v1 balance', () => {
  const state = engine.createInitialState();
  assert.equal(state.status, 'ready');
  assert.equal(state.score, 0);
  assert.equal(state.shotsRemaining, 5);
  assert.equal(state.targets.length, 3);
  assert.ok(state.targets.every(target => target.hp === 1 && target.destroyed === false));
});

test('near-zero shot is invalid and does not spend a shot', () => {
  const state = engine.createInitialState();
  const outcome = engine.resolveShot(state, {
    start: { x: 0.5, y: 0.86 },
    end: { x: 0.501, y: 0.859 }
  });
  assert.equal(outcome.result.valid, false);
  assert.equal(outcome.state.shotsRemaining, 5);
  assert.equal(outcome.state.score, 0);
});
```

- [ ] **Step 2: Testi çalıştır ve beklendiği gibi fail olduğunu doğrula**

Run:

```bash
node --test shot-yikim/shot-yikim-engine.test.js
```

Expected: FAIL çünkü `shot-yikim-engine.js` henüz yok.

- [ ] **Step 3: Minimum başlangıç state'i ve şut doğrulamayı uygula**

`shot-yikim-engine.js` içinde browser/CommonJS wrapper kullan:

```js
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShotYikimEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const CONFIG = Object.freeze({
    shots: 5,
    hitScore: 100,
    destroyBonus: 150,
    roundBonus: 300,
    minShotPower: 0.03
  });

  const TARGETS = Object.freeze([
    { id: 'target-1', x: 0.28, y: 0.31, radius: 0.075 },
    { id: 'target-2', x: 0.50, y: 0.22, radius: 0.075 },
    { id: 'target-3', x: 0.72, y: 0.31, radius: 0.075 }
  ]);

  function createInitialState() {
    return {
      status: 'ready',
      score: 0,
      shotsRemaining: CONFIG.shots,
      targets: TARGETS.map(target => ({ ...target, hp: 1, destroyed: false })),
      lastShot: null
    };
  }

  function shotPower(shot) {
    const dx = Number(shot?.end?.x) - Number(shot?.start?.x);
    const dy = Number(shot?.end?.y) - Number(shot?.start?.y);
    return Math.hypot(dx, dy);
  }

  function isValidShot(shot) {
    return Number.isFinite(shotPower(shot)) && shotPower(shot) >= CONFIG.minShotPower;
  }
```

İlk aşamada `resolveShot()` geçersiz şutta state'i değiştirmeden dönsün; `resetGame()` `createInitialState()` çağırsın.

- [ ] **Step 4: Testi tekrar çalıştır ve PASS doğrula**

Run: `node --test shot-yikim/shot-yikim-engine.test.js`

Expected: 2 PASS.

- [ ] **Step 5: Çarpışma, puan ve durum geçişi testlerini ekle**

Aynı test dosyasına şu davranışları gerçek koordinatlarla ekle:

```js
test('valid hit destroys one target, spends one shot and awards 250 points', () => {
  const state = engine.createInitialState();
  const outcome = engine.resolveShot(state, {
    start: { x: 0.5, y: 0.9 },
    end: { x: 0.28, y: 0.31 }
  });
  assert.equal(outcome.result.valid, true);
  assert.equal(outcome.result.hitTargetId, 'target-1');
  assert.equal(outcome.result.destroyedTargetId, 'target-1');
  assert.equal(outcome.state.shotsRemaining, 4);
  assert.equal(outcome.state.score, 250);
  assert.equal(outcome.state.targets[0].destroyed, true);
});

test('last target awards round bonus and completes round', () => {
  const state = engine.createInitialState();
  state.targets[0].destroyed = true;
  state.targets[0].hp = 0;
  state.targets[1].destroyed = true;
  state.targets[1].hp = 0;
  const outcome = engine.resolveShot(state, {
    start: { x: 0.5, y: 0.9 },
    end: { x: 0.72, y: 0.31 }
  });
  assert.equal(outcome.state.status, 'round-complete');
  assert.equal(outcome.state.score, 550);
});

test('missing with the final shot ends the game when targets remain', () => {
  const state = engine.createInitialState();
  state.shotsRemaining = 1;
  const outcome = engine.resolveShot(state, {
    start: { x: 0.5, y: 0.9 },
    end: { x: 0.05, y: 0.05 }
  });
  assert.equal(outcome.state.shotsRemaining, 0);
  assert.equal(outcome.state.status, 'game-over');
});

test('reset returns a clean initial state', () => {
  const reset = engine.resetGame();
  assert.deepEqual(reset, engine.createInitialState());
});
```

- [ ] **Step 6: Testlerin fail olduğunu doğrula**

Run: `node --test shot-yikim/shot-yikim-engine.test.js`

Expected: çarpışma/puan/durum davranışları henüz uygulanmadığı için yeni testler FAIL.

- [ ] **Step 7: Çizgi-daire çarpışmasını ve immutable `resolveShot` akışını uygula**

`lineHitsTarget()` şut başlangıç-bitiş segmentinin hedef merkezine en yakın noktasını hesaplasın. `resolveShot()` state'in kopyası üzerinde yalnız ilk canlı hedefi etkilesin; geçerli her şut 1 hak harcasın; hedef yıkılırsa 100 + 150, son hedefse ayrıca 300 puan eklesin. Tüm hedefler yıkılırsa `round-complete`; hak biter ve hedef kalırsa `game-over`; aksi halde `playing` olsun.

```js
function lineHitsTarget(shot, target) {
  const ax = shot.start.x, ay = shot.start.y;
  const bx = shot.end.x, by = shot.end.y;
  const abx = bx - ax, aby = by - ay;
  const lengthSq = abx * abx + aby * aby;
  if (!lengthSq) return false;
  const projection = ((target.x - ax) * abx + (target.y - ay) * aby) / lengthSq;
  const t = Math.max(0, Math.min(1, projection));
  const px = ax + abx * t, py = ay + aby * t;
  return Math.hypot(target.x - px, target.y - py) <= target.radius;
}
```

- [ ] **Step 8: Motor testlerini çalıştır**

Run: `node --test shot-yikim/shot-yikim-engine.test.js`

Expected: tüm testler PASS.

- [ ] **Step 9: Commit**

```bash
git add shot-yikim/shot-yikim-engine.js shot-yikim/shot-yikim-engine.test.js
git commit -m "feat: add Shot Yikim game engine"
```

### Task 2: Bağımsız mobil oyun ekranı

**Files:**
- Create: `shot-yikim/index.html`
- Create: `shot-yikim/shot-yikim.css`
- Create: `shot-yikim/shot-yikim-ui.test.js`

**Interfaces:**
- Consumes: `window.ShotYikimEngine` ve sonraki task'ta tanımlanacak `shot-yikim.js`.
- Produces DOM IDs: `#shotYikimBoard`, `#shotYikimBall`, `#shotYikimAim`, `#shotYikimScore`, `#shotYikimShots`, `#shotYikimStatus`, `#shotYikimRestart`, `#shotYikimTargets`.

- [ ] **Step 1: HTML sözleşme smoke testini yaz**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('standalone page exposes the required game surface and loads scripts in order', () => {
  const html = read('index.html');
  for (const id of ['shotYikimBoard','shotYikimBall','shotYikimAim','shotYikimScore','shotYikimShots','shotYikimStatus','shotYikimRestart','shotYikimTargets']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.ok(html.indexOf('shot-yikim-engine.js') < html.indexOf('shot-yikim.js'));
  assert.match(html, /shot-yikim\.css/);
});

test('styles are scoped and board is touch-safe', () => {
  const css = read('shot-yikim.css');
  assert.match(css, /\.shot-yikim/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /aspect-ratio/);
});
```

- [ ] **Step 2: Smoke testi çalıştırıp FAIL doğrula**

Run: `node --test shot-yikim/shot-yikim-ui.test.js`

Expected: HTML/CSS olmadığı için FAIL.

- [ ] **Step 3: `index.html` iskeletini oluştur**

Sayfa bir `.shot-yikim` kökü altında başlık, HUD, oyun tahtası, hedef katmanı, top, nişan çizgisi, durum metni ve yeniden başlat butonu içersin. Hedefler HTML'e sabit yazılmasın; motor state'inden JS ile render edilsin. Script sırası:

```html
<script src="./shot-yikim-engine.js"></script>
<script src="./shot-yikim.js"></script>
```

Board erişilebilirlik için `role="application"`, açıklayıcı `aria-label`, durum metni `aria-live="polite"` kullansın.

- [ ] **Step 4: Mobil öncelikli CSS'i oluştur**

`.shot-yikim` scope'u dışına kural çıkmasın. Board `aspect-ratio: 9 / 14`, `touch-action: none`, `position: relative`, `overflow: hidden` kullansın. Top alt-ortada, hedefler normalize koordinatlardan `left/top` ile konumlanabilsin. `.is-destroyed` hedefi küçülme/opacity animasyonuyla kaybolsun; aim çizgisi `transform-origin: 0 50%` kullansın. `prefers-reduced-motion: reduce` durumunda animasyon süreleri kapatılsın.

- [ ] **Step 5: UI smoke testlerini çalıştır**

Run: `node --test shot-yikim/shot-yikim-ui.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add shot-yikim/index.html shot-yikim/shot-yikim.css shot-yikim/shot-yikim-ui.test.js
git commit -m "feat: add Shot Yikim standalone game screen"
```

### Task 3: Pointer kontrolü, render ve reset akışı

**Files:**
- Modify: `shot-yikim/shot-yikim-ui.test.js`
- Create: `shot-yikim/shot-yikim.js`

**Interfaces:**
- Consumes: `window.ShotYikimEngine.createInitialState()`, `.resolveShot(state, shot)`, `.resetGame()`.
- Produces: browser global `window.ShotYikimUI` ve test için CommonJS exports `clamp01`, `pointFromEvent`, `shotFromDrag`, `statusText`.

- [ ] **Step 1: Saf UI yardımcı fonksiyon testlerini ekle**

```js
test('ui module normalizes pointer coordinates and derives a shot', () => {
  const ui = require('./shot-yikim.js');
  const board = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 400 }) };
  assert.deepEqual(ui.pointFromEvent({ clientX: 110, clientY: 220 }, board), { x: 0.5, y: 0.5 });
  assert.deepEqual(
    ui.shotFromDrag({ x: 0.5, y: 0.9 }, { x: 0.28, y: 0.31 }),
    { start: { x: 0.5, y: 0.9 }, end: { x: 0.28, y: 0.31 } }
  );
});

test('status copy covers all engine states', () => {
  const ui = require('./shot-yikim.js');
  assert.match(ui.statusText({ status: 'ready' }), /Nişan/);
  assert.match(ui.statusText({ status: 'playing' }), /Devam/);
  assert.match(ui.statusText({ status: 'round-complete' }), /Tamam/);
  assert.match(ui.statusText({ status: 'game-over' }), /Bitti/);
});
```

- [ ] **Step 2: Testlerin FAIL olduğunu doğrula**

Run: `node --test shot-yikim/shot-yikim-ui.test.js`

Expected: `shot-yikim.js` olmadığı için FAIL.

- [ ] **Step 3: UMD wrapper ve saf yardımcıları uygula**

`shot-yikim.js` Node ortamında DOM'a dokunmadan export edilebilmeli; browser ortamında DOMContentLoaded sonrası `mount()` çağrılmalı.

```js
(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.ShotYikimUI = api;
    if (root.document) root.document.addEventListener('DOMContentLoaded', () => api.mount(root.document));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const clamp01 = value => Math.max(0, Math.min(1, value));
  function pointFromEvent(event, board) {
    const rect = board.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height)
    };
  }
  function shotFromDrag(start, end) { return { start: { ...start }, end: { ...end } }; }
```

- [ ] **Step 4: Pointer akışını ve render'ı uygula**

`mount(doc)`:

1. Gerekli DOM node'larını bulsun; yoksa `false` dönsün.
2. `let state = engine.createInitialState()` ile başlasın.
3. `render(state)` HUD ve hedefleri tek state'ten üretsin.
4. `pointerdown` yalnız aktif oyun durumunda board içinde aim başlangıcını kaydetsin ve `setPointerCapture()` kullansın.
5. `pointermove` aim çizgisinin açı/uzunluğunu görsel olarak güncellesin.
6. `pointerup` normalize şutu `engine.resolveShot()` ile çözsün; invalid şutta hak harcanmadığı motor state'inden gelsin.
7. `round-complete` ve `game-over` durumunda yeni pointerdown kabul etmesin.
8. Restart butonu `engine.resetGame()` çağırıp tüm DOM'u yeniden render etsin.

Hedef render'ında her hedef için `data-target-id`, `left: target.x * 100%`, `top: target.y * 100%`, `.is-destroyed` kullan.

- [ ] **Step 5: UI helper testlerini çalıştır**

Run: `node --test shot-yikim/shot-yikim-ui.test.js`

Expected: tüm UI testleri PASS.

- [ ] **Step 6: Tüm Şut Yıkım testlerini birlikte çalıştır**

Run:

```bash
node --test shot-yikim/*.test.js
```

Expected: motor + UI smoke/helper testlerinin tamamı PASS.

- [ ] **Step 7: Commit**

```bash
git add shot-yikim/shot-yikim.js shot-yikim/shot-yikim-ui.test.js
git commit -m "feat: add Shot Yikim pointer gameplay"
```

### Task 4: Entegrasyon güvenliği ve v1 kabul kontrolü

**Files:**
- Modify only if a discovered test defect requires it: `shot-yikim/*`
- Do not modify any existing Bizim Skor runtime file.

**Interfaces:**
- Consumes: Task 1-3 çıktıları.
- Produces: branch üzerinde test edilmiş bağımsız oynanabilir v1.

- [ ] **Step 1: Şut Yıkım tam test paketini çalıştır**

Run: `node --test shot-yikim/*.test.js`

Expected: PASS, sıfır failure.

- [ ] **Step 2: Mevcut root test paketini regresyon için çalıştır**

Repo package script kullanmadığı için mevcut test dosyalarını Node runner ile çalıştır:

```bash
node --test *.test.js
```

Expected: mevcut root testleri PASS. Şut Yıkım klasörü root glob'a dahil olmadığı için mevcut suite kendi halinde doğrulanır.

- [ ] **Step 3: İzolasyon kontrolü yap**

Run:

```bash
git diff --name-only main...feature/shot-yikim-v1
```

Expected: yalnız `docs/superpowers/specs/2026-09-15-shot-yikim-v1-design.md`, `docs/superpowers/plans/2026-09-15-shot-yikim-v1.md` ve `shot-yikim/` altındaki yeni dosyalar görünmeli. Mevcut Bizim Skor runtime dosyalarında değişiklik olmamalı.

- [ ] **Step 4: Basit statik sunucuda manuel kabul kontrolü yap**

Run:

```bash
python3 -m http.server 4173
```

Open: `http://localhost:4173/shot-yikim/`

Kontrol et:

- Sayfa telefona yakın dar viewport'ta taşmadan açılıyor.
- Parmağı/mouse'u board üzerinde sürükleyip bırakınca şut oluşuyor.
- Hedefe isabet hedefi yıkıyor, skor 250 artıyor ve şut 1 azalıyor.
- Boşa geçerli atış şutu azaltıyor fakat skor eklemiyor.
- Son hedef yıkılınca toplam son vuruşa 550 puan (100 isabet + 150 yıkım + 300 tur bonusu) ekleniyor ve yeni şut engelleniyor.
- 5 şut sonunda hedef kalırsa `game-over` metni gösteriliyor.
- Yeniden başlat state'i 0 puan, 5 şut, 3 hedef durumuna döndürüyor.

- [ ] **Step 5: Son doğrulama commit'i gerekiyorsa yap**

Yalnız test/manual kontrolde bir düzeltme yapıldıysa:

```bash
git add shot-yikim
git commit -m "fix: harden Shot Yikim v1 gameplay"
```

Değişiklik gerekmediyse ek commit oluşturma.

- [ ] **Step 6: Branch durumunu doğrula**

Run:

```bash
git status --short
git log --oneline --decorate -5
```

Expected: working tree temiz; bütün yeni commitler `feature/shot-yikim-v1` üzerinde ve `main` değiştirilmemiş.

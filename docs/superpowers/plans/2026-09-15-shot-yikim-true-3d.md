# Şut Yıkım True 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Şut Yıkım's 2D Matter.js tower simulation with a real Three.js + Rapier 3D table-top destruction game across 20 levels.

**Architecture:** Keep campaign/state rules in a pure CommonJS/browser-compatible engine. Put all Three.js/Rapier scene, rigid-body, raycasting, aiming and simulation work in a separate ES module. The page controller owns menu/HUD/level transitions and talks to the 3D game through a small callback API.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Three.js 0.186.0, `@dimforge/rapier3d-compat` 0.20.0, Node `node:test`, Vercel preview.

**Spec:** `docs/superpowers/specs/2026-09-15-shot-yikim-true-3d-design.md`

## Global Constraints
- Work only on `feature/shot-yikim-v1`.
- Do not modify Bizim Skor runtime or production integration.
- Keep exactly 20 campaign levels.
- Input is free-aim: tap any point on the 3D canvas, never click a specific target button.
- Blocks are removed only by real 3D physics leaving the table.
- No invisible side walls around the table.
- Pin Three.js to `0.186.0` and Rapier compat to `0.20.0`.

---

### Task 1: Pure 3D Campaign Model

**Files:**
- Modify: `shot-yikim/shot-yikim-engine.js`
- Modify: `shot-yikim/shot-yikim-engine.test.js`

**Interfaces:**
- Produces `LEVELS`, `createInitialState()`, `startGame()`, `createStateForRound(round, score, phase)`, `recordShot(state)`, `recordFallen(state, count)`, `completeRound(state)`, `failRound(state)`, `startNextRound(state)`, `resetRound(state)`.
- Each level exposes `blocks[]` with `id`, `position:{x,y,z}`, `size:{x,y,z}`, `shape`, `material`, and optional `rotationY`.

- [ ] **Step 1: Write failing tests** asserting 20 levels, first level simple, later levels have depth (`z`) variation, all bodies have positive 3D dimensions, no HP field exists, level 20 is campaign final, and shot/score transitions work.
- [ ] **Step 2: Run** `node --test shot-yikim-engine.test.js` and verify RED against the old 2D model.
- [ ] **Step 3: Implement** a 20-level 3D layout generator with increasing row/layer/depth complexity and pure state transitions.
- [ ] **Step 4: Re-run** the engine tests and verify GREEN.
- [ ] **Step 5: Commit** `feat: model Shot Yikim 3D campaign`.

### Task 2: Three.js + Rapier 3D Runtime

**Files:**
- Create: `shot-yikim/shot-yikim-3d.js`
- Create: `shot-yikim/shot-yikim-3d.test.js`

**Interfaces:**
- Produces `createGame3D({ container, level, onBlockFallen, onSettled })` returning `{ shootAtClientPoint(clientX, clientY), reset(level), setEnabled(enabled), getRemainingBlockCount(), dispose() }`.
- Uses pinned ESM CDN imports for Three.js and Rapier compat.

- [ ] **Step 1: Write failing static contract tests** checking pinned Three/Rapier URLs, Raycaster-based free aim, perspective camera, ground/table rigid bodies, no side-wall colliders, dynamic block rigid bodies, spherical football rigid body, X/Y/Z transforms, and callbacks for fallen blocks/settling.
- [ ] **Step 2: Run** `node --test shot-yikim-3d.test.js` and verify RED because the runtime does not exist.
- [ ] **Step 3: Implement** scene/camera/lights/stadium/table/ground, Rapier world and colliders, dynamic towers, raycasting, football shot impulse, animation loop and block-fallen tracking.
- [ ] **Step 4: Re-run** the runtime contract tests and verify GREEN.
- [ ] **Step 5: Commit** `feat: add true 3D Shot Yikim physics`.

### Task 3: Page Controller and 3D UI

**Files:**
- Modify: `shot-yikim/index.html`
- Modify: `shot-yikim/shot-yikim.js`
- Modify: `shot-yikim/shot-yikim.css`
- Modify: `shot-yikim/shot-yikim-ui.test.js`

**Interfaces:**
- HTML exposes `shotYikimViewport` as the canvas host.
- Controller dynamically imports `shot-yikim-3d.js`, starts/reset levels, decrements balls on accepted taps, adds score when blocks fall, advances when remaining count reaches zero after settle, and fails on settled state with zero balls.

- [ ] **Step 1: Write failing UI contract tests** requiring the 3D viewport, module controller, free-aim pointer handler, absence of Matter.js and old DOM physics blocks, and 3D error message path.
- [ ] **Step 2: Run** UI tests and verify RED.
- [ ] **Step 3: Implement** menu/HUD/status/controller wiring and 3D-focused responsive styling.
- [ ] **Step 4: Run all Node tests** and verify GREEN.
- [ ] **Step 5: Commit** `feat: wire Shot Yikim 3D gameplay`.

### Task 4: Verification and Preview

**Files:** no production files unless a verification fix is required.

- [ ] **Step 1:** Run `node --test shot-yikim/*.test.js` and confirm all tests pass.
- [ ] **Step 2:** Run syntax/import/static checks locally; if Chromium/Playwright is installed, run a local browser smoke test and confirm WebGL canvas creation and no console error.
- [ ] **Step 3:** Push only the tested standalone files to `feature/shot-yikim-v1`.
- [ ] **Step 4:** Wait for Vercel preview `READY` and fetch `/shot-yikim/` plus `/shot-yikim/shot-yikim-3d.js` to confirm the pinned 3D imports are live.
- [ ] **Step 5:** Return the preview URL to the user; do not merge or deploy main.

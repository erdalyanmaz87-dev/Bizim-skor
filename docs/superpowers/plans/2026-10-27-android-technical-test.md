# Android technical test implementation checkpoint

Goal: prepare an isolated Android technical test while retaining the live web game.
Architecture: bundle the existing static site into Capacitor; keep production sources and database unchanged. This first checkpoint is not a Play-ready release and does not implement the planned auth migration.

- [x] Clone source into separate checkout and create `android/internal-test` branch.
- [x] Pin Capacitor 8.5.3 and generate Android project targeting API 36.
- [x] Package only application assets; disable web push/service worker in native entry.
- [x] Verify asset packaging using three Node tests (including native invite URL regression observed fail before fix, pass after fix).
- [x] Produce debug APK and verify signature/package metadata. Resolve local toolchain networking using the current proxy and JDK 21/system trust store.
- [ ] Real Android device verification and invite/public-domain checks.
- [ ] Store policy preparation and agreed email authentication migration.
- [ ] Play account verification, closed testing, and production review.

No release, live deployment or database mutation was performed. Developer account is not yet opened. Do not claim testing is active or an installable APK exists.

2026-10-27 continuation: APK produced and signed with debug key; no Play upload, real-device verification, or authentication migration performed.

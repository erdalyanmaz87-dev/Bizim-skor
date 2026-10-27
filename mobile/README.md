# BizimSkor Android test 1.1

Package: `com.bizimskor.internal`, versionCode 2, target API 36, Capacitor 8.5.3.
This remains a debug technical test, not a Play-ready release. The user reported
that the preceding APK worked on Android with player `kahve`; this updated APK
still needs a physical-device regression run.

## Implemented

- Android-only removal of material prize copy, official team/competition crests
  and chat UI/database/realtime operations. Cups, scores and standings remain.
- Email or username/password sign-in, minimum 8-character passwords, signup
  confirmation-code UI, recovery-code UI and password changes.
- Verified Auth user → immutable player ID mapping; legacy token/PIN ownership
  proof links an existing player without recreating historical game records.
- New email-only players have a random discarded bcrypt secret and no legacy
  device-recovery identity, preventing old unset-PIN claim paths.
- Deletion request/cancellation flows go to the existing administrator support
  inbox. No automatic destructive deletion is performed. Legacy test accounts
  can also submit a deletion/support request without email migration.
- Bundled privacy, terms and deletion information pages.

The live website source is unchanged. Shared Supabase received additive private
account tables, protected RPCs and the mobile-account-auth Edge Function.
Existing players, predictions and old login functions were not migrated or reset.
Existing test sessions and PIN login remain during the transition; linking does
not retire a legacy PIN. Never enter predictions for other players without an
explicit instruction.

## Remaining before email rollout

The owner has no mail service configured. Set up a transactional mail provider
and custom SMTP in Supabase. Confirm email confirmation is enabled and Auth's
minimum password length is 8. Both confirmation and recovery templates must
show `{{ .Token }}` for the in-app code entry. Default link-only mail templates
redirect to the live website and do not complete native recovery by themselves.
Test signup, delivery, verification and recovery with an owner-designated real
address before claiming email delivery works. No real emails were sent by the
agent, and no existing player has been linked during development.

Privacy/deletion pages are bundled drafts. Public deployment was blocked by
automatic approval review because publishing the owner's personal email as a
public contact was not explicitly authorized. That address has been removed
from source and APK; select/approve a public support address, add the external
request method and publish the pages before Play submission.

## Verification

`npm test` runs 37 checks covering packaging, transformed gameplay, forbidden
content, account logic and DOM forms. The synthetic transactional integration
script in `test/auth-backend.integration.sql` executed successfully against the
shared DB and rolled back all synthetic rows. It covers ownership, confirmation,
bans, bridge compatibility, legacy claim rejection for new email players,
throttling, deletion inbox idempotency/cancellation and API grants.
After rollback: Auth users 0, mappings 0, deletion queue 0, max live player ID 543.
Normal PostgreSQL sequence gaps may remain; no sequence was reset.

Deployed gateway smoke checks: invalid input 400; nonexistent username login
401 with generic error; anonymous account-status RPC 401. These do not prove
actual email delivery. No browser/emulator or physical-device run of this new
build has been completed; a local browser binary download failed.

## Build

Requires Node 22+, JDK 21, Android SDK API 36 and network access for Gradle/Maven.
Use the environment's current proxy if necessary; never commit credentials,
proxy addresses or signing keys.

```sh
cd mobile
npm ci
npm test
npm run build:debug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`.
Website source files are bundled with build-time Android transforms, not edited.
Web push is disabled; native notifications remain a separate future feature.

Before Play: mail delivery/templates, approved public privacy and deletion URLs,
manual deletion processing runbook, Data safety declarations, final package ID,
release signing, reviewer access, Play account verification and required testing.

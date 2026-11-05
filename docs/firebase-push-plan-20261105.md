# Android Firebase push completion

Goal: Native Android receives authorized server notifications without exposing Firebase credentials or other players' device tokens. Existing game and web behavior is preserved.

## Design and authorization

User authorized completing Firebase, retaining all security fixes and preparing the Android update; Play upload remains separate. Existing isolated branch: android/update-v1.0.1. Firebase project bizimskor, sender 745234102630, package com.bizimskor.app. User created dedicated bizimskor-bildirim service account with Firebase Cloud Messaging API Admin, downloaded its JSON themselves, and saved it directly as Supabase FIREBASE_SERVICE_ACCOUNT. Its contents never entered chat or the app/repository.

Android registers only after notification opt-in plus a game session. A random per-installation device capability and increasing revision are persisted in private app storage (backup disabled). This capability can only revoke that installation's notifications; it cannot sign into a game account or send messages. Server hashes it and resolves the player from a valid game session. Higher-revision revocation creates a tombstone so a delayed subscribe cannot re-enable notifications. Revocation is independent of an expired game session and does not queue behind a stalled subscribe. Firebase unregister is initiated too; its SDK callback alone is not treated as proof of server revocation.

Server table is RLS protected with no player/anon grants. Device management/listing functions are service-role-only; SECURITY DEFINER is required for their narrowly scoped active-account/session/ban lookup, with empty search_path and schema-qualified references. Active delivery requires a nonexpired game session, active player and no Auth ban. Invalid Firebase device tokens disable only the matching row revision and token. Ordinary/anonymous callers cannot send notifications. Existing cron/service authorization and player targeting remain unchanged.

Notification dispatch retains the deployed web predictionBadge behavior and 24-hour/3-hour reminder thresholds. Native reminders are sent by the existing five-minute server job, avoiding duplicate local reminders. The old local-alarm fallback is cancelled in FCM-enabled builds. Notification taps open the internal prediction view.

## Verification / progress

- Protected native-push-check v1 deployed: real OAuth + Firebase validate_only request 41890 returned 200, configured/oauth_valid/fcm_permission_valid true, notifications_sent 0.
- Migration 20261105210226_native_push_devices.sql applied. Anonymous write false, player target-list read false, service-role read true. No native devices yet (old app lacks FCM).
- native-push-subscribe v1, send-push v10 and notification-dispatch v7 deployed. Live invalid-session native registration and unauthenticated send both returned 401. No additional test notification was sent to players.
- 65/65 mobile tests and 11/11 FCM/SQL/delivery tests pass. Full root suite remains red due to the prior 12 unrelated failures plus the browser helper's missing @sparticuz/chromium runtime dependency; see test logs/status report. Do not claim the entire repository is green.
- Independent review identified delayed-permission identity race and an existing database gate limit of 1000. Both were reproduced before fixes; added race test passes, live rollback-only gate test with [1000,300,60] returns true. No Firebase credential disclosure found.

Next: compile final AAB, sign locally with the same upload key, validate bundle/manifest/packaged FCM and deliver. Physical Android notification delivery still needs testing on the updated app. Play upload/publish has not occurred.

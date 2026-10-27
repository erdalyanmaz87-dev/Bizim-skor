# BizimSkor Android technical test

Status: source prepared; APK build blocked in the preparation environment while downloading Gradle (`Network is unreachable`). No APK or AAB has been produced or tested on a phone. Not ready for Google Play closed testing or production.

## Scope

Capacitor 8.5.3 with bundled copies of the current website, Android package `com.bizimskor.internal`, target API 36. This isolated source branch does not change the live site or database schema. Existing player accounts and 4-digit PIN flow are unchanged. The bundled interface labels itself as a technical test and warns that signing in or saving a prediction uses the live account.

## Build

Requires Node 22+, compatible Android/JDK environment (use Android Studio 2025.2.1+), Android SDK API 36, and access to Gradle/Google Maven repositories.

```sh
cd mobile
npm ci
npm test
npm run build:debug
```

Expected APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Debug package is for direct technical testing, not a signed Play release. Release signing and Play account setup are intentionally not configured. Retain signing keys securely when a production package is created; do not commit credentials.

## Checked

- Entry page and directly referenced local scripts are bundled.
- Unit test files, administrative HTML and web service worker are excluded.
- Web push loader and service worker registration are disabled in the bundled native entry only.
- Source website files remain untouched.

## Must test on real Android

- Cold launch, offline handling, scrolling, keyboard, Android back behavior.
- Login with an explicitly designated test account; no player predictions are entered by the agent.
- Week and competition navigation, rankings, Arena and cup screens.
- Links and invite sharing must point to the public domain, never localhost.
- Native notifications require a separate implementation; existing web push is not native push.

## Before Play testing

Complete reward removal, third-party logo removal, agreed chat decision, privacy policy, data safety declarations, account deletion, reviewer credentials, and account verification. Implement the agreed email/password migration separately with preservation of player identity and records. Select the production package identity before registering a Play application. Invite the required testers only after a working build and account are available.

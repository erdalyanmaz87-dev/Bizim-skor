# Web email account upgrade

Approved in conversation: visible home card, dismissible reminder on every game opening until linked; verified email and password of 8–256 characters; web login by email OR existing player name with the new password. iOS and Android users retain one stable player identity, predictions, leagues and points. Existing unlinked PIN users keep access.

## Approach
Reuse deployed mobile-account-auth signup/login/recover and verified mobile_link_player/mobile_issue_player_session RPCs. Use a separate Supabase Auth client/storage key so legacy web RPCs keep their current authorization. An additive token-authenticated status RPC controls reminders; an admin-only aggregate reports completed/incomplete players without emails. No passwords in storage, logs or administrator views. No new player creation in the linking flow. Alternative of changing legacy PIN columns is rejected because Android uses Auth and would not share that password.

## Safety and validation
Revalidate legacy identity from the server before linking; reject mismatched pre-linked email accounts. Resume after reload without saving passwords. Stale async responses must not affect a switched/logged-out player. Test minimum password, invalid/expired session, duplicate accounts, OTP failure, cross-player linking, repeat reminders, accessibility and mobile layout. Test in preview before production.

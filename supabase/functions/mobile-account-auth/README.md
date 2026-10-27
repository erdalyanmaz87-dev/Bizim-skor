# Mobile account bridge

The SQL is an additive, separately reviewed install script. It preserves existing
players, PINs and legacy login functions. No automatic deletion is implemented.

## Deployment prerequisites

- Enable email confirmations and minimum Auth password length 8 in Supabase.
- Verify a working mail sender for signup/recovery and delivery to tester addresses.
- Configure the allowed email redirect `https://bizimskor.com` and confirmation/
  recovery templates. Native UI can verify the code with Auth `verifyOtp` using
  `type: 'signup'` or `type: 'recovery'`, then `updateUser({password})` for recovery.
  The mail template must include the token if entering a code in the app.
- Deploy this public function with JWT verification disabled. It only performs
  login/signup/recovery; identity RPCs require a verified authenticated user.
- Automatic project `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
  `SUPABASE_SERVICE_ROLE_KEY` are the only environment dependencies.
- Validate that the deployment gateway normalizes `x-forwarded-for` before
  relying on the IP limit. Global and identity limits also apply independently.

## Public function contract

POST JSON to `/functions/v1/mobile-account-auth`:

| Request | Success |
| --- | --- |
| `{action:'login',identifier,password}` | `{session}` (standard Auth token response) |
| `{action:'signup',email,password,name}` | `{needsConfirmation:true}` |
| `{action:'recover',email}` | `{ok:true}` |

Signup's `name` is only a pending display hint in editable metadata. No mapping or
player is created until a confirmed user calls a protected RPC. An existing name
is allowed at signup so its owner can then prove legacy ownership.

Errors are `{error:code}`: invalid login is always `401 invalid_credentials`,
invalid inputs `400`, `429 rate_limited`, signup provider sending failure
`503 email_service_unavailable`, auto-confirm configuration
`503 email_confirmation_required`, infrastructure failure
`503 auth_service_unavailable`. Provider error text and resolved emails are never
returned or logged. A successful login naturally returns the signed-in user's
own email in the Auth session. Passwords accepted by the gateway are 8–256 chars.
Recovery delivery outcomes, including provider errors, always return `{ok:true}`
to avoid revealing which addresses triggered a send. This confirms acceptance,
not email delivery; communicate sender availability separately during setup.

## Authenticated RPC contract

Call through an Auth client carrying the user's access token; confirmation is
checked against `auth.users` on every call. Business errors return `{error:code}`;
check this even when the HTTP response is successful.

| RPC | Arguments | Success |
| --- | --- | --- |
| `mobile_account_status` | none | `{linked,player_id,player_name,deletion_status,deletion_request}` |
| `mobile_link_player` | `p_name,p_legacy_token=null,p_pin=null,p_device_id=null` | `{player_id,player_name}` |
| `mobile_create_player` | `p_name,p_device_id=null` | `{player_id,player_name}` |
| `mobile_issue_player_session` | `p_device_id=null` | `{token,player_id,player_name,expires_at}` |
| `mobile_request_account_deletion` | `p_reason=null` | `{id,status:'requested'}` |
| `mobile_cancel_account_deletion` | none | `{id,status:'cancelled'}` or `{id:null,status:'none'}` |

The bridge `token` is the existing application's `p_token`/localStorage token.
It expires in 30 days. Mapping uses the immutable player ID, and issuance reads
the player's current name. Linking prefers a valid legacy token; otherwise it
verifies the current four-digit bcrypt PIN. No device identity alone proves
ownership. Historical duplicate names differing only by case fail closed.
Supabase sign-out or banning prevents future protected RPCs/issuance, but does
not retroactively invalidate an already-issued legacy token. That separate token
follows existing legacy expiry/revocation rules. Clear both sessions on app logout.

New names are 3–30 letters/digits/spaces/underscore/dot/hyphen, case-insensitively
unused including inactive players. Creation serializes against legacy inserts.
New email-only players get a bcrypt hash of a discarded server-generated random
256-bit secret, never a NULL/unset PIN, and keep `device_id=NULL` regardless of the
submitted device hint. This blocks legacy first-PIN claiming and registered-device
PIN recovery; no usable four-digit PIN is created. Migrated existing players keep
their legacy PIN and registered device, so their old PIN login/recovery paths remain
active during transition.
The registration device is preserved on existing players. Pending deletion is
idempotent and reversible, does not disable login, and requires manual processing.
Each pending deletion request creates one existing support inbox notice (category
`other`) with a reference to the private queue ID. Cancellation marks its notice
resolved and explicitly cancelled. No player, prediction, or session is deleted.
Legacy manual imports can leave the shared player identity sequence behind the
largest ID. Creation returns `registration_temporarily_unavailable` on a collision;
it never resets a shared sequence. Inspect/fix any sequence mismatch separately.

## Limits and verification

All gateway actions: 500 global and 30 per IP in a fixed 15-minute window;
login 10 per identifier, signup/recover 3 per identifier. Keys are HMAC-SHA256
with the server-only service key. Link proof: 10 per verified uid and target name
per 15 minutes; session issuance: 30 per uid per 15 minutes. Expired buckets are
removed in batches of at most 200 per consumed bucket. These are app limits in
addition to Supabase Auth limits; direct Auth endpoints retain provider controls.
The gateway cannot impose its custom limits on direct Supabase Auth calls.

`node --test mobile/test/auth-backend.test.mjs` tests gateway policy using synthetic
providers and SQL boundary contracts. A local PostgreSQL execution test and
deployed end-to-end test are still required before claiming SQL runtime validity
or successful email delivery. No live users or real email sends are used by tests.
`mobile/test/auth-backend.integration.sql` is a database-owner integration test
for an installed schema. It rolls back synthetic auth users, players, sessions,
mapping rows, rate buckets and support notices; it never calls mail APIs. As with
all PostgreSQL sequences, consumed sequence values may leave normal gaps after
rollback. It inspects the player sequence first and refuses a behind sequence.
Run it only with database-owner permission after reviewing the script.

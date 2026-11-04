> Historical preview-only plan. Later user instructions and current live validation supersede the original release restriction. See docs/security-report-status.md. The two erroneous inactive accounts must not be recreated.

# Security report hardening

Goal: preserve PIN login and every game record while closing the reported authorization and recovery paths. Work only on security/report-hardening-preview-20261104. No production deployment or SQL mutation is authorized.

1. Test anonymous push denial before any database access; add a service/cron authorization guard and method restriction to send-push and retire the obsolete test sender.
2. Test credential attempts across verify/session/link/profile; prepare an additive migration with a private, persistent account limiter. Failure returns must commit counters, not raise and roll them back. Disable legacy account claiming and device-only resets. Add verified-email PIN reset. Keep existing function signatures for installed clients.
3. Replace login preflight with atomic session creation, explain email recovery and support fallback, restrict anonymous directories, and reject new email-shaped display names server-side.
4. Verify signup responses and administrator guards. Add CSP compatible with existing inline scripts, with hashes generated at build time. Android native source is absent; do not invent FileProvider paths or change package identity.
5. Run focused security tests plus full baseline comparison. Create a preview only, with production network access blocked. Include a clearly labelled interactive review of the new flows. Do not represent this UI review as a hosted staging database test.

Review focus: null/empty input, whitespace and mixed-case account aliases, parallel PIN attempts, limiter rollback, normal-player versus expired-admin sessions, failed email verification, existing installed Android clients, and no production writes from preview.

Baseline: node --test: 705 tests, 691 passing, 14 existing failures (navigation/service worker, Arena eligibility/placement, browser harness dependencies, active-round archive, fixture matching, two-week loader). Full log kept outside repository during work.

Release gates: schema/function backup and tested rollback; approval to affect production; native Android project for FileProvider and build identity verification; isolated hosted database if live end-to-end backend testing is required.

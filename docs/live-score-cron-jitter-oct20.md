# Live-score cron jitter — 20 October 2026

The 16:45 UTC job fetched and matched two Champions League fixtures before live status arrived. Its request timestamp was 16:45:02.700. At 16:50:00.568 the next cron invocation saw less than five elapsed minutes and skipped a full cycle. The provider and authentication were working.

SoccersAPI now opts into at most 15 seconds of scheduling grace. Other adaptive-poll callers remain strict by default. Active-fixture checks, daily quota reservation, provider normalization, manual-score priority and finalization are unchanged. Seven pure-JavaScript regression cases were executed against the actual helper: boundary jitter, strict default, early poll, no active matches, exhausted quota, capped grace, completed interval.

An authorized catch-up using the existing cron command succeeded at 16:51 UTC: matched=2, updated=2, finalized=0, requests_left=98. Both scores and first-half status were recorded; the user confirmed display. Edge Function deployed as version 31 with existing authentication and all other source files preserved.

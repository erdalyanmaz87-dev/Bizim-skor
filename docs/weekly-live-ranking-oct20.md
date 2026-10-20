# Weekly live points — 20 October 2026

Weekly boards for Süper Lig, Champions League and Nations League project points from the existing live score cache. A single **Canlı** label appears above the table while at least one match is in progress (including half time), and disappears once the last in-progress match becomes terminal. Future kickoffs never score. A terminal cache score remains visible while official result confirmation is pending; official results take precedence.

The new read-only RPC returns aggregate ranks and counts, never individual unplayed predictions. It reuses existing versioned match scoring, opportunity multipliers and invitation eligibility cutoffs. General rankings, Arena and stored results are unchanged.

Only visible weekly boards refresh every 30 seconds. This reads Supabase's cache, without any extra football-provider requests. The existing five-minute provider schedule is unchanged. Identical data does not replace the table, scroll is retained, and stale week/table/session responses are discarded.

Validation:
- JavaScript syntax and behavioral tests: label lifecycle, escaping, weekly-only scope, observer throttling, unchanged DOM, scroll, hidden views and async race guards.
- Rolled-back database integration checks: session rejection, all three leagues, live points, future exclusion, finished weeks and FT transition without losing pending final scores.
- No runtime shell/browser environment was available; browser appearance has not been manually verified.

The default week advances at kickoff, without waiting for a completed result. Entering weekly rankings selects today's most recently started competition. Switching competition selects its latest started week; week-strip buttons still allow viewing earlier weeks.

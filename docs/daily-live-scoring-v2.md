# Daily prediction score badges — 20 October 2026

The daily-match personal prediction badge had its own fixed legacy 4/1 calculator and stale opportunity IDs. It now resolves scoring version and category from the existing shared scoring engine and reads opportunity matches from the shared registry, without additional API calls. Fixture context is passed through the render chain, including kickoff/version for newly published IDs and terminal status.

Version-2 badges: 🎯 exact 10, 🥅 outcome+goal difference 6, 🔢 outcome+total goals 4, ✅ outcome only 2, ❌ wrong outcome 0. Opportunity matches double once. Finished games show earned points without the transient Anlık wording. Legacy scoring is retained and absent scores are not converted to 0-0.

Regression: 0-2 prediction against final 1-2 on Champions League fixture 37 now renders ✅ Sadece sonuç • 2 puan, replacing the stale 1-point label. Different correct draws earn six points. The actual CommonJS modules were executed in the available JS runtime: 17 existing tests and 10 new tests passed; additional direct matrix checks cover 26 category/legacy/null/final cases. No database, provider polling, admin controls or ranking calculations were changed.

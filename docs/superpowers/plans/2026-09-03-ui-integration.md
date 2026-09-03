# Bizim Skor UI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Safely wire the approved header, horizontal menu, prediction cards, and shared scrolling week selectors into the existing Bizim Skor UI without changing scoring, prediction persistence, or Supabase business logic.

**Architecture:** Keep existing `index.html` business functions as the source of truth. Load focused enhancement modules after the core application is initialized, and have them delegate to existing tab handlers/loaders instead of duplicating logic.

**Tech Stack:** Vanilla JavaScript, existing Supabase client, GitHub/Vercel deployment.

**Spec:** Approved conversation design for `ui-header-phase1`.

## Global Constraints
- Work only on `ui-header-phase1`; do not merge to `main` during integration.
- Do not change scoring formulas, X2 rules, prediction save/update RPCs, or database schema.
- Reuse existing `loadWeeklyRanking`, `loadResultsWeeks`, `renderFixtureWeek`, `loadHistory`, and `renderHistoryWeek` behavior.
- Hafta Sıralaması, Fikstür and Tahmin Geçmişim use the same horizontal week-strip interaction.
- Verify module tests and script loading before any live deployment.

---

- [ ] Identify a safe already-loaded bootstrap point.
- [ ] Add a failing integration test for the ordered enhancement scripts.
- [ ] Wire enhancement modules in dependency-safe order.
- [ ] Run unit/integration checks locally using fetched branch files.
- [ ] Re-fetch changed branch files and review the diff.
- [ ] Stop for user approval before merging/deploying.

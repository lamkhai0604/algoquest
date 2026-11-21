# Code Review — 2026-11-20

| Field | Value |
| --- | --- |
| Scope | `backend/`, `frontend/`, `content/`, `scripts/`, records under `docs/` |
| Source revision | `dev` after Sprint 10 |
| Method | Read of each module against [ARCHITECTURE.md](../ARCHITECTURE.md); unused-symbol and unused-file scans; phone-width layout check (375 px) of the main pages |
| Out of scope | `frontend/src/i18n/` and [I18N-FOUNDATION.md](../I18N-FOUNDATION.md) (language track); findings there are reported, not changed |

## 1. Summary

The code is in good shape: module boundaries match the architecture, the content validator and the replay tests cover every level, and no dead feature code was found. The review fixed two layout bugs on phones and removed a little leftover code. Seven items are reported for later; none blocks Sprint 11.

## 2. Fixed in this change

| # | Area | Finding | Fix |
| --- | --- | --- | --- |
| R-1 | Frontend | Bug: on a 375 px phone the header was 426 px wide, so every page scrolled sideways. The `.sr-only` utility used by the language label did not exist, so the label took visible space, and the header stats did not wrap. | Added `.sr-only` to `global.css`; on narrow screens the stats take their own row and wrap. |
| R-2 | Frontend | Bug: lesson and level pages could grow wider than the screen when a child (a code block, a wide visualizer) had a large minimum width, because the grid columns were `auto`/`1fr`. | Columns are now `minmax(0, 1fr)`, so wide children scroll inside their own box. All checked pages now measure exactly 375 px. |
| R-3 | Backend | Empty packages `runner` and `config` held only a `package-info.java`; the work lives in `code` and `game`. | Removed both. |
| R-4 | Backend | `game/package-info.java` described a leaderboard that does not exist. | Comment now lists the real use cases. |
| R-5 | Backend | `LevelRules.totalXp` (FR-08.4) was tested but unused; `ProfileService` summed XP on its own. | `ProfileService` now calls the domain rule. |
| R-6 | Records | Architecture, README, tools, SRS open questions, deploy guide and agent guide described Sprint 4–5 state (old API list, ER model, module list, stack versions). | Rebuilt from the controllers, migrations and package layout; see the Sprint 10 report. |

## 3. Reported, not changed

| # | Area | Finding | Impact | Suggested handling |
| --- | --- | --- | --- | --- |
| R-7 | Frontend i18n | About 80 translation keys are not found by a literal scan, and `SUPPORTED_LOCALES` is exported but unused. Some keys may be built at run time. | Size only. | Language track to confirm and prune. |
| R-8 | Backend | The daily limit for pattern challenges resets at UTC midnight, not the learner's local midnight. | Minor: the reset hour looks odd outside UTC. | Accept for Phase 1, or reuse the streak's time-zone handling. |
| R-9 | Backend | JavaScript code runs execute in the browser and the server trusts the reported result (D-035, T-505). | A learner could fake a passing run. Practice only; tests and XP do not depend on it. | Accepted by design; revisit if code runs ever award XP. |
| R-10 | Backend | JavaScript code runs have no rate limit and each run stores a `code_run` row. | Minor: table growth under abuse. | Add a per-user limit or retention window in Phase 2. |
| R-11 | Product | The leaderboard (FR-14, T-403) is specified but not built; no endpoint exists. | Feature gap, already in the backlog. | Plan in Phase 2 or drop from the SRS. |
| R-12 | Content | In the Level 11 bit view, boxes are drawn left to right while bit 0 is the rightmost bit. The walkthrough text now says so. | Possible confusion for beginners. | Consider labelling each box with its bit index in a later visual pass. |
| R-13 | Frontend | Many exports are used only inside their own file (mostly local types). | None. | No action. |

## 4. Verification

- Phone layout: home, level, lesson (Levels 6, 8, 11), profile and pattern pages measured at 375 px with no horizontal overflow.
- Backend verify, frontend check and the records check run in CI on this change.

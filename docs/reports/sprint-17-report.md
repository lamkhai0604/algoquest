# Sprint 17 Report — Level 20 Greedy & Intervals and Level 21 Dynamic Programming Fundamentals

| Field | Value |
| --- | --- |
| Sprint | Sprint 17 ([plan](../sprints/sprint-17.md)) |
| Dates | 2026-11-20 to 2026-11-21 |
| Goal | Levels 20 and 21 are playable in the five-step lesson format at the standard of Levels 4–19, with pattern challenges; interval problems are drawn on a time axis. Phase 2 is complete |
| Outcome | **Goal met; sprint closed 2026-11-21.** Merged to `main` in pull request #40 after PO review. Phase 2 is complete |

## Increment

- **Interval timeline view (D-066):** a walkthrough step can give each cell an interval. Intervals are drawn as bars on a shared time axis; kept intervals are filled and ticked, the marker outlines the current interval, and a dashed sweep line marks a point in time. Newly kept bars pop, and the marker and the line slide between steps.
- **Level 20 Greedy & Intervals:** lesson (safe greedy choices and the exchange argument, counterexamples to tempting rules, activity selection, merging, a sweep for rooms, jump reach); an 8-step activity-selection walkthrough on the timeline view; an intuition question; a quick check; 6 practice and 3 test problems.
- **Level 21 Dynamic Programming Fundamentals:** lesson (state, transition, base cases and order; memoization and tables; space saving; greedy versus DP with coin change); a 7-step walkthrough that fills the dp array cell by cell with the two cells it reads shaded; an intuition question; a quick check; 6 practice and 3 test problems.
- **Pattern challenges:** Conference Talk Picker, Office Room Planner, Shared Calendar Busy Times; Arcade Token Change, Warehouse Robot Routes, Document Diff Tool.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-572 Interval timeline view | `visual.intervals`, `visual.chosen`, `visual.line` in the content model and content check; the timeline view with motion | Loader and content-check tests; rendering test; screenshots on desktop and phone; PO review | PR #40 |
| T-573 Level 20 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; greedy rules checked against brute force on 400 small random inputs; lesson code compiles and runs; replay test against activity selection; PO review | PR #40 |
| T-574 Level 20 pattern challenges | Three challenges | Content check; PO review | PR #40 |
| T-575 Level 21 content | As T-573 | As T-573, with a replay test against the recurrence | PR #40 |
| T-576 Level 21 pattern challenges | Three challenges | Content check; PO review | PR #40 |
| T-577 Sprint report and Phase 2 summary | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviewed both levels and the timeline view with the checklist and merged the pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 206 tests, 0 failed; content check includes Levels 20 and 21 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| PO content review | 41 checklist items, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

- D-066 Interval timeline view.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| Hidden-test inputs for interval problems approached the Java harness size limit | Largest inputs reduced to about 330 intervals |
| Formatting check failed on new tests | Formatter applied before merge |

## Phase 2 summary (Levels 12–21)

Phase 2, Problem-Solving Patterns, ran from Sprint 13 to Sprint 17 and delivered ten levels: Two Pointers, Sliding Window, Prefix Sum, Binary Search, Fast & Slow Pointers, Monotonic Stack, DFS & BFS Patterns, Backtracking, Greedy & Intervals, and Dynamic Programming Fundamentals.

| Measure | Result |
| --- | --- |
| Levels delivered | 10 (Levels 12–21), each with lesson, walkthrough, intuition, quick check, 6 practice and 3 test problems, and 3 pattern challenges |
| Problems with hidden tests | 90, every answer computed by two independent reference solutions (JavaScript and Java) |
| Pattern challenges | 30 |
| New visual tools | Window range (D-063), animated playback (D-061), graph view (D-060), graph explorer (D-064), motion in every view and the stack strip (D-065), interval timeline (D-066) |
| Other | Demo sign-in for visitors (D-062) |

Every level passed the PO's checklist review before merging. Vietnamese text for Phase 2 and Hard problems remain open (localization track, T-501).

## Next sprint

Sprint 18 opens Phase 3 (Interview Mastery) with Level 22 Mixed Pattern Problems and Level 23 1D & 2D Dynamic Programming, a table view for 2-D DP, and a System Design tab marked "Coming soon".

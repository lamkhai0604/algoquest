# Sprint 14 Report — Level 14 Prefix Sum & Range Queries and Level 15 Binary Search

| Field | Value |
| --- | --- |
| Sprint | Sprint 14 ([plan](../sprints/sprint-14.md)) |
| Dates | 2026-11-20 |
| Goal | Levels 14 and 15 are playable in the five-step lesson format at the standard of Levels 4–13, with pattern challenges |
| Outcome | **Goal met; sprint closed 2026-11-20.** Merged to `main` in pull request #37 after PO review |

## Increment

- **Level 14 Prefix Sum & Range Queries:** lesson (prefix arrays, O(1) range sums, prefix sums with a hash map, 2D prefix sums, difference arrays); an 8-step walkthrough that builds the prefix array and answers two shaded range queries; an intuition question; a quick check; 6 practice and 3 test problems, including the parked running-sum problem.
- **Level 15 Binary Search:** lesson (two loop invariants, lower and upper bounds, searching on the answer, an overflow-safe middle); a 5-step walkthrough with `lo`, `mid` and `hi` and the remaining range shaded; an intuition question; a quick check; 6 practice and 3 test problems.
- **Pattern challenges:** Game Stats Page, Ledger Stretches, Population Map Tiles; Order Number Lookup, Slowest Printer Speed, First Broken Release.
- The parked-content folder is retired: all of it now lives in Levels 12 and 14.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-556 Level 14 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions (parked answers confirmed); lesson code compiles and runs; replay test; PO review | PR #37 |
| T-557 Level 14 pattern challenges | Three challenges | Content check; PO review | PR #37 |
| T-558 Level 15 content | As T-556 | As T-556 | PR #37 |
| T-559 Level 15 pattern challenges | Three challenges | Content check; PO review | PR #37 |
| T-560 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviewed both levels with the checklist and merged the pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 206 tests, 0 failed; content check includes Levels 14 and 15 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | Passed on `dev` |
| PO content review | 40 checklist items, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

None new.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| The checker for a "next letter" problem returns a `char` in Java and a string in JavaScript | Confirmed that both runners and the Java harness already convert characters to strings |
| A long walkthrough code line scrolls sideways on phones in Level 15 | Accepted for now: code blocks scroll inside their box |

## Not done

- Vietnamese text for Levels 14 and 15 (localization track), Hard problems (T-501).

## Next sprint

Sprint 15: Level 16 Fast & Slow Pointers (on the linked-list view) and Level 17 Monotonic Stack.

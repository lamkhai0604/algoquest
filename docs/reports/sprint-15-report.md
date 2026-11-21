# Sprint 15 Report — Level 16 Fast & Slow Pointers and Level 17 Monotonic Stack

| Field | Value |
| --- | --- |
| Sprint | Sprint 15 ([plan](../sprints/sprint-15.md)) |
| Dates | 2026-11-20 |
| Goal | Levels 16 and 17 are playable in the five-step lesson format at the standard of Levels 4–15, with pattern challenges |
| Outcome | **Goal met; sprint closed 2026-11-20.** Merged to `main` in pull request #38 after PO review |

## Increment

- **Level 16 Fast & Slow Pointers:** lesson (middle node, Floyd's cycle detection and the cycle start, next-index arrays and number sequences, fixed gaps); an 8-step Floyd walkthrough on the linked-list view with a back pointer; an intuition question; a quick check; 6 practice and 3 test problems (`ListNode` lists and next-index arrays for cycles).
- **Level 17 Monotonic Stack:** lesson (stack order per question, indexes for distances, the O(n) argument, greedy digit removal); a 9-step next-greater walkthrough with the waiting stack; an intuition question; a quick check; 6 practice and 3 test problems.
- **Pattern challenges:** Router Loop, Middle of a Streamed Playlist, Duplicate Badge Number; Price Alert Days, Shortest Voucher Code, Skyline Viewpoints.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-561 Level 16 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson code compiles and runs; replay test; PO review | PR #38 |
| T-562 Level 16 pattern challenges | Three challenges | Content check; PO review | PR #38 |
| T-563 Level 17 content | As T-561 | As T-561 | PR #38 |
| T-564 Level 17 pattern challenges | Three challenges | Content check; PO review | PR #38 |
| T-565 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviewed both levels with the checklist and merged the pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 206 tests, 0 failed; content check includes Levels 16 and 17 |
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
| Hidden tests cannot hold a pointer cycle in a `ListNode` list | Cycle problems use a next-index array; the lesson shows it is the same structure |
| A walkthrough prediction sat one step early | Moved to the step whose result it asks about |
| The "State after each step" table cuts its last column on narrow layouts | Recorded for a later layout pass |

## Not done

- Vietnamese text for Levels 16 and 17 (localization track), Hard problems (T-501).

## Next sprint

Sprint 16: Level 18 DFS & BFS Patterns with the interactive graph explorer (T-543) and Level 19 Backtracking.

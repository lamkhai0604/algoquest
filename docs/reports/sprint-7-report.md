# Sprint 7 Report — Level 6 Stack, Queue & Deque

| Field | Value |
| --- | --- |
| Sprint | Sprint 7 ([plan](../sprints/sprint-7.md)) |
| Dates | 2026-11-19 |
| Goal | Level 6 (Stack, Queue & Deque) is playable in the five-step lesson format at the Level 4 and 5 standard, with pattern challenges |
| Outcome | **Goal met; sprint closed 2026-11-19.** Level 6 is on `main`. The PO reviewed Level 6 and its pattern challenges with no corrections |

## Increment

- **Level 6 Stack, Queue & Deque:** five-step lesson (last in, first out; first in, first out; the deque; why `shift()` on a JavaScript array is O(n)), an 8-step bracket-check walkthrough with two predictions, an intuition question, a quick check, 6 practice problems, and 3 test problems. Hard problems stay "Coming soon".
- **Pattern challenges:** Recipe Undo, Print Room, Tag Check.
- **Site name as one variable** (`VITE_APP_NAME`), merged in the same pull request.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-522 Level 6 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review | Yes |
| T-523 Level 6 pattern challenges | Three challenges | Content check; PO review | Yes |
| T-524 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviews and merges each `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 202 tests, 0 failed; content check includes Level 6 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | 6 passed |
| PO content review | 20 checklist items for Level 6, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

None new.

## Problems and fixes

None in this sprint.

## Not done

- Live Java check (D-054), Hard problems (T-501), Vietnamese text for Level 6 (localization track).

## Next sprint

Sprint 8: Level 7 Recursion & Divide and Conquer.

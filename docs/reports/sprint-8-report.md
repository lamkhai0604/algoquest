# Sprint 8 Report — Level 7 Recursion & Divide and Conquer

| Field | Value |
| --- | --- |
| Sprint | Sprint 8 ([plan](../sprints/sprint-8.md)) |
| Dates | 2026-11-19 to 2026-11-20 |
| Goal | Level 7 (Recursion & Divide and Conquer) is playable in the five-step lesson format at the standard of Levels 4–6, with pattern challenges |
| Outcome | **Goal met; sprint closed 2026-11-20.** Level 7 is in the `dev → main` pull request. The PO reviewed Level 7 and its pattern challenges with no corrections |

## Increment

- **Level 7 Recursion & Divide and Conquer:** five-step lesson (base case and recursive case, the call stack, memoization, divide and conquer, recursion depth), an 8-step call-stack walkthrough with two predictions, an intuition question, a quick check, 6 practice problems, and 3 test problems. Hard problems stay "Coming soon".
- **Pattern challenges:** Garden Steps, Signal Boost, Shuffle Score.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-525 Level 7 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; call-stack replay test; PO review | In the `dev → main` pull request |
| T-526 Level 7 pattern challenges | Three challenges | Content check; PO review | In the `dev → main` pull request |
| T-527 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviews and merges each `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 202 tests, 0 failed; content check includes Level 7 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | 6 passed |
| PO content review | 20 checklist items for Level 7, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

None new.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| Hidden tests with arrays of several thousand numbers made the generated Java test program exceed the 64 KB method limit | Hidden test arrays stay at about 1,000 numbers; the complexity of a slower solution is caught by the AI review of the explanation |

## Not done

- Live Java check (D-054), Hard problems (T-501), Vietnamese text for Level 7 (localization track).

## Next sprint

Sprint 9: Level 8 Trees & Binary Search Trees, with a tree visualizer and tree arguments in code runs.

# Sprint 10 Report — Level 9 Heap & Priority Queue and Level 11 Bit Manipulation & Basic Math

| Field | Value |
| --- | --- |
| Sprint | Sprint 10 ([plan](../sprints/sprint-10.md)) |
| Dates | 2026-11-20 |
| Goal | Levels 9 and 11 are playable in the five-step lesson format at the standard of Levels 4–8, with pattern challenges; both reuse existing visualizers |
| Outcome | **Goal met; sprint closed 2026-11-20.** Levels 9 and 11 are in the `dev → main` pull request. The PO reviewed both levels and their pattern challenges with no corrections. Players reach Level 11 after Level 10 (Sprint 11) |

## Increment

- **Level 9 Heap & Priority Queue:** lesson (heap rule and array layout, sift-up and sift-down, a heap class for JavaScript, `PriorityQueue`, top-k, k-way merge), a 5-step push walkthrough on the tree view, an intuition question, a quick check, 6 practice problems, and 3 test problems.
- **Level 11 Bit Manipulation & Basic Math:** lesson (operators, masks, `n & (n - 1)`, XOR, bitmask subsets, gcd, the sieve, remainders, 32-bit notes), a 6-step bit-count walkthrough, an intuition question, a quick check, 6 practice problems, and 3 test problems.
- **Pattern challenges:** Top Sellers, Merge News Feeds, Charging Bays; Lost Ticket, Feature Flags, Prime Table.
- **Lesson tables** accept `\|` for a literal pipe inside a cell.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-533 Level 9 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; heap replay test; PO review | In the `dev → main` pull request |
| T-534 Level 9 pattern challenges | Three challenges | Content check; PO review | In the `dev → main` pull request |
| T-535 Level 11 content | As T-533 | As T-533, with a bit-count replay test | In the `dev → main` pull request |
| T-536 Level 11 pattern challenges | Three challenges | Content check; PO review | In the `dev → main` pull request |
| T-537 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviews and merges each `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 203 tests, 0 failed; content check includes Levels 9 and 11 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | 6 passed |
| PO content review | 40 checklist items, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

None new.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| A `\|` inside a lesson table cell split the cell | The table parser treats `\|` as a literal pipe |
| The cell view numbers boxes from the left, while bit 0 is the rightmost bit | The walkthrough explains it; a bit-numbered view can follow if needed |

## Not done

- Level 10 (Sprint 11), live Java check (D-054), Hard problems (T-501), Vietnamese text for Levels 9 and 11 (localization track).

## Next sprint

Documentation refresh and code review, then Sprint 11: Level 10 Graph Fundamentals with a graph visualizer.

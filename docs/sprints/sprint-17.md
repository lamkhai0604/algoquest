# Sprint 17 — Level 20 Greedy & Intervals and Level 21 Dynamic Programming Fundamentals

| Field | Value |
| --- | --- |
| Status | Approved by the PO on 2026-11-20 |
| Goal | Levels 20 and 21 are playable in the five-step lesson format at the standard of Levels 4–19, with pattern challenges; interval problems are drawn on a time axis. Phase 2 is complete |
| Duration | About 1 week from approval |
| Tasks | T-572, T-573, T-574, T-575, T-576, T-577 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-057, D-061, D-063, D-065, D-066 |

## Increment at the end of the sprint

- **Interval timeline view (D-066):** a walkthrough step can give each cell an interval. The intervals are drawn as bars on a shared time axis, one row each; kept intervals are highlighted, the current interval carries the marker, and an optional sweep line marks a point in time (such as the end of the last kept meeting). Bars move with the same motion as the other views.
- **Level 20 Greedy & Intervals:** lesson (the greedy choice and how to argue it is safe, sorting by end to keep the most intervals, merging overlaps, meeting rooms with a sweep, jump reach); an activity-selection walkthrough on the timeline view; an intuition question; a quick check; 6 practice and 3 test problems.
- **Level 21 Dynamic Programming Fundamentals:** lesson (overlapping subproblems, memoization and tables, state and transition, base cases, the order of filling, space saving); a walkthrough that fills a dp array cell by cell with the cells it reads shaded; an intuition question; a quick check; 6 practice and 3 test problems.
- Three pattern challenges for each level. Hard problems stay "Coming soon" (T-501).

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-572 Interval timeline view | `visual.intervals`, `visual.chosen`, `visual.line` in the content model and content check; the timeline view with motion | One bar per cell on a common axis; kept bars and the marker are visible without colour alone; fits a 375 px phone; nothing moves with reduced motion | Backend and frontend tests; screenshots |
| 2 | T-573 Level 20 content | Lesson, walkthrough, intuition, quick check, 9 problems, Hard placeholders | Same content shape as Levels 4–19; every hidden test answer computed by JavaScript and Java reference solutions | Content check; reference runs; walkthrough replay test; screenshots |
| 3 | T-574 Level 20 pattern challenges | Three challenges | One best approach each | Content check; PO review |
| 4 | T-575 Level 21 content | As T-573, on the cell view | As T-573 | As T-573 |
| 5 | T-576 Level 21 pattern challenges | Three challenges | As T-574 | As T-574 |
| 6 | T-577 Sprint 17 report and Phase 2 summary | `docs/reports/sprint-17-report.md` | Implemented, verified, reviewed, merged listed separately; Phase 2 outcome summarized | Records check |

Out of scope: Phase 3 levels (22–27), Vietnamese text (localization track), Hard problems (T-501).

## Risks

| Risk | Handling |
| --- | --- |
| A greedy rule that looks right but is not (for example, shortest interval first) | The lesson shows a counterexample; reference solutions are checked against brute force on small random inputs |
| DP answers can overflow 32-bit integers | Limits keep answers inside `int`, or the problem asks for the answer modulo 1,000,000,007 |

## Work for the PO

- Review Levels 20 and 21 with the review checklist, including the timeline view on a phone.

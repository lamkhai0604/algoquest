# Sprint 8 — Level 7 Recursion & Divide and Conquer

| Field | Value |
| --- | --- |
| Status | **Closed 2026-11-20** ([report](../reports/sprint-8-report.md)). Approved by the PO on 2026-11-19 |
| Goal | Level 7 (Recursion & Divide and Conquer) is playable in the five-step lesson format at the standard of Levels 4–6, with pattern challenges |
| Duration | About 1 week from approval |
| Tasks | T-525, T-526, T-527 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-049, D-052, D-056, D-057 |

## Increment at the end of the sprint

- Level 7 opens after Level 6's test, with a five-step lesson (base case and recursive case, the call stack, remembering results to avoid repeated work, divide and conquer with split, solve, combine, and when recursion depth becomes a problem), a walkthrough of the call stack for a recursive sum, an intuition question, a quick check, 6 practice problems (3 Easy, 3 Medium), and 3 test problems. Hard problems stay "Coming soon" (T-501).
- Three pattern challenges on the Level 7 page.

The existing cell view draws the call stack, one cell per call. Full dynamic programming stays in Level 21 and backtracking in Level 19, as the curriculum map says.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-525 Level 7 content | Lesson, walkthrough, intuition question, quick check, 9 problems with original stories, Hard placeholders | Same content shape as Levels 4–6; every hidden test answer computed by JavaScript and Java reference solutions; Java samples are complete classes | Content check; reference runs; walkthrough replay test; screenshots |
| 2 | T-526 Level 7 pattern challenges | Three challenges in `patterns.json` | Content check; one best approach each | Content check; PO review |
| 3 | T-527 Sprint 8 report | `docs/reports/sprint-8-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Vietnamese text for Level 7 (localization track), Hard problems (T-501), Levels 8 and later (T-502), the live Java check (D-054).

## Risks

| Risk | Handling |
| --- | --- |
| New content is written by AI and may contain mistakes | Reference solutions compute every hidden answer; the PO reviews with the checklist before the `dev → main` merge |
| Deep recursion in a learner's code can overflow the stack | Problem limits keep the depth small, and the lesson explains the limit |

## Work for the PO

- Review the Level 7 content with the review checklist.

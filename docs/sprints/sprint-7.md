# Sprint 7 — Level 6 Stack, Queue & Deque

| Field | Value |
| --- | --- |
| Status | **Closed 2026-11-19** ([report](../reports/sprint-7-report.md)). Approved by the PO on 2026-11-19 |
| Goal | Level 6 (Stack, Queue & Deque) is playable in the five-step lesson format at the Level 4 and 5 standard, with pattern challenges |
| Duration | About 1 week from approval |
| Tasks | T-522, T-523, T-524 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-049, D-052, D-056, D-057 |

## Increment at the end of the sprint

- Level 6 opens after Level 5's test, with a five-step lesson (last in, first out; first in, first out; the deque; matching and undo with a stack; simulation with a queue; why `shift()` on a JavaScript array is slow), a walkthrough of a bracket check with a stack, an intuition question, a quick check, 6 practice problems (3 Easy, 3 Medium), and 3 test problems. Hard problems stay "Coming soon" (T-501).
- Three pattern challenges on the Level 6 page.

The existing cell view draws the stack and the queue; no new visualizer is needed. Monotonic stacks stay in Level 17, as the curriculum map says.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-522 Level 6 content | Lesson, walkthrough, intuition question, quick check, 9 problems with original stories, Hard placeholders | Same content shape as Levels 4 and 5; every hidden test answer computed by JavaScript and Java reference solutions; Java samples are complete classes | Content check; reference runs; walkthrough replay test; screenshots |
| 2 | T-523 Level 6 pattern challenges | Three challenges in `patterns.json` | Content check; one best approach each | Content check; PO review |
| 3 | T-524 Sprint 7 report | `docs/reports/sprint-7-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Vietnamese text for Level 6 (localization track), Hard problems (T-501), Levels 7 and later (T-502), the live Java check (D-054).

## Risks

| Risk | Handling |
| --- | --- |
| New content is written by AI and may contain mistakes | Reference solutions compute every hidden answer; the PO reviews with the checklist before the `dev → main` merge |

## Work for the PO

- Review the Level 6 content with the review checklist.

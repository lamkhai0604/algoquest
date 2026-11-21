# Sprint 15 — Level 16 Fast & Slow Pointers and Level 17 Monotonic Stack

| Field | Value |
| --- | --- |
| Status | **Closed 2026-11-20** ([report](../reports/sprint-15-report.md)). Approved by the PO on 2026-11-20 |
| Goal | Levels 16 and 17 are playable in the five-step lesson format at the standard of Levels 4–15, with pattern challenges. Level 16 uses the linked-list view (D-058); Level 17 uses the cell view |
| Duration | About 1 week from approval |
| Tasks | T-561, T-562, T-563, T-564, T-565 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-052, D-056, D-057, D-058 |

## Increment at the end of the sprint

- **Level 16 Fast & Slow Pointers:** lesson (two speeds on a linked list, the middle node, Floyd's cycle detection and finding the cycle's start, the same idea on a "next index" array or a number sequence, a fixed gap for "k-th from the end"); a walkthrough of Floyd's cycle detection on the linked-list view, where one `next` pointer jumps back; an intuition question; a quick check; 6 practice and 3 test problems.
- **Level 17 Monotonic Stack:** lesson (keeping a stack in increasing or decreasing order, the next greater or smaller element, why each item is pushed and popped once, spans and widths); a walkthrough of "next greater element" with the waiting stack shown at each step; an intuition question; a quick check; 6 practice and 3 test problems.
- Three pattern challenges for each level. Hard problems stay "Coming soon" (T-501).

Hidden tests cannot store a pointer cycle in a linked list, so cycle problems give the structure as a "next index" array; linked-list problems without cycles use `ListNode` (D-058).

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-561 Level 16 content | Lesson, walkthrough, intuition, quick check, 9 problems, Hard placeholders | Same content shape as Levels 4–15; every hidden test answer computed by JavaScript and Java reference solutions | Content check; reference runs; walkthrough replay test; screenshots |
| 2 | T-562 Level 16 pattern challenges | Three challenges | One best approach each | Content check; PO review |
| 3 | T-563 Level 17 content | As T-561 | As T-561 | As T-561 |
| 4 | T-564 Level 17 pattern challenges | Three challenges | As T-562 | As T-562 |
| 5 | T-565 Sprint 15 report | `docs/reports/sprint-15-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Levels 18–21 (later sprints), Vietnamese text (localization track), Hard problems (T-501).

## Risks

| Risk | Handling |
| --- | --- |
| Cycle problems cannot use `ListNode` tests | A "next index" array stands for the links; the lesson shows that it is the same idea |
| Monotonic stacks are easy to get backwards (increasing or decreasing) | The lesson names the rule per question type; the replay test checks the stack at every step |

## Work for the PO

- Review Levels 16 and 17 with the review checklist.

# Sprint 6 — Level 5 Linked Lists

| Field | Value |
| --- | --- |
| Status | **Approved — PO, 2026-11-19** |
| Goal | Level 5 (Linked Lists) is playable in the five-step lesson format at the Level 4 standard, with a visualizer that draws nodes and their `next` pointers, list arguments in code runs, and pattern challenges |
| Duration | About 1 week from approval |
| Tasks | T-511, T-518, T-519, T-520 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05, FR-07; decisions D-048, D-049, D-052, D-056, D-057, D-058 |

## Increment at the end of the sprint

- Level 5 opens after Level 4's test, with a five-step lesson (nodes and pointers, walking a list, inserting and deleting with a dummy node, reversing in place, merging two sorted lists), a walkthrough of an in-place reversal, an intuition question, a quick check, 6 practice problems (3 Easy, 3 Medium), and 3 test problems. Hard problems stay "Coming soon" (T-501).
- The visualizer draws a linked list: each node with its value and where its `next` pointer goes, including `null`.
- In the code editor, a linked-list argument arrives as a `ListNode` and a returned `ListNode` is checked as a list, in JavaScript and in the Java harness.
- Two or three pattern challenges on the Level 5 page.

Fast and slow pointers (middle node, cycles) stay in Level 16, as the curriculum map says.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-518 Visualizer: linked nodes | `Visual` gains an optional `next` list: for each cell, the index of the node it points to, or -1 for `null`. Arrows between neighbouring nodes; each node shows its target | Existing walkthroughs render unchanged; a bad index or a self-pointer fails the content check; translated walkthroughs must match the English pointers | Backend and frontend tests; screenshots on desktop and phone |
| 2 | T-519 List arguments in code runs (D-058) | A parameter or return type `ListNode` in the Java starter marks a list. Tests keep lists as arrays. The JavaScript runner builds `ListNode` objects and turns a returned list back into an array; the Java harness does the same | A list longer than the input limit or with a cycle reports an error instead of hanging; problems without lists unchanged | Runner and harness tests; smoke |
| 3 | T-511 Level 5 content | Lesson, walkthrough, intuition question, quick check, 9 problems with original stories, Hard placeholders | Same content shape as Level 4; every hidden test answer computed by JavaScript and Java reference solutions; Java samples are complete classes | Content check; reference runs; walkthrough replay test; screenshots |
| 4 | T-520 Level 5 pattern challenges | Three challenges in `patterns.json` | Content check; one best approach each | Content check; PO review |
| 5 | T-521 Sprint 6 report | `docs/reports/sprint-6-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Vietnamese text for Level 5 (the localization track), Hard problems (T-501), Levels 6 and later (T-502), the live Java check (D-054).

## Risks

| Risk | Handling |
| --- | --- |
| New content is written by AI and may contain mistakes | Reference solutions compute every hidden answer; the PO reviews with the checklist before the `dev → main` merge |
| Pointer code in a learner's run can loop forever | The browser runner's 5 s limit; turning a returned list into an array stops at the length limit |

## Work for the PO

- Review the Level 5 content with the review checklist.

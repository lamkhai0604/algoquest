# Sprint 9 — Level 8 Trees & Binary Search Trees

| Field | Value |
| --- | --- |
| Status | **Closed 2026-11-20** ([report](../reports/sprint-9-report.md)). Approved by the PO on 2026-11-20 |
| Goal | Level 8 (Trees & Binary Search Trees) is playable in the five-step lesson format, with a visualizer that draws a binary tree, tree arguments in code runs, and pattern challenges |
| Duration | About 1 week from approval |
| Tasks | T-528, T-529, T-530, T-531, T-532 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05, FR-07; decisions D-048, D-049, D-052, D-056, D-057, D-059 |

## Increment at the end of the sprint

- Level 8 opens after Level 7's test, with a five-step lesson (nodes, children, leaves, and height; depth-first traversals in pre-, in-, and post-order; level-order traversal with a queue; the binary search tree rule; search and insert in O(height)), a walkthrough of a search in a binary search tree, an intuition question, a quick check, 6 practice problems (3 Easy, 3 Medium), and 3 test problems. Hard problems stay "Coming soon" (T-501).
- The visualizer draws a binary tree with its edges and highlights the nodes a step points at.
- In the code editor, a tree argument arrives as a `TreeNode`, and a returned `TreeNode` is checked as a tree, in JavaScript and in the Java harness (D-059).
- Three pattern challenges on the Level 8 page.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-528 Visualizer: binary tree | `visual.tree`; tree view drawn as SVG that scales to the screen | Existing walkthroughs unchanged; a child without a parent or more than 31 cells fails the content check; translated walkthroughs must keep the tree flag | Backend and frontend tests; screenshots on desktop and phone |
| 2 | T-529 Tree arguments in code runs | `TreeNode` in the JavaScript worker and the Java harness | Level-order arrays in and out; problems without trees unchanged | Helper tests; harness test that compiles and runs tree code |
| 3 | T-530 Level 8 content | Lesson, walkthrough, intuition question, quick check, 9 problems with original stories, Hard placeholders | Same content shape as Levels 4–7; every hidden test answer computed by JavaScript and Java reference solutions; Java samples are complete classes | Content check; reference runs; walkthrough replay test; screenshots |
| 4 | T-531 Level 8 pattern challenges | Three challenges | Content check; one best approach each | Content check; PO review |
| 5 | T-532 Sprint 9 report | `docs/reports/sprint-9-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: balanced trees (AVL, red-black) beyond a mention, Vietnamese text for Level 8 (localization track), Hard problems (T-501), the live Java check (D-054).

## Risks

| Risk | Handling |
| --- | --- |
| New content is written by AI and may contain mistakes | Reference solutions compute every hidden answer; the PO reviews with the checklist |
| A tree drawing becomes unreadable on phones | SVG scales to the width; at most 5 levels in a walkthrough |

## Work for the PO

- Review the Level 8 content with the review checklist.

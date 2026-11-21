# Sprint 16 — Level 18 DFS & BFS Patterns and Level 19 Backtracking

| Field | Value |
| --- | --- |
| Status | Approved by the PO on 2026-11-20 |
| Goal | Levels 18 and 19 are playable in the five-step lesson format at the standard of Levels 4–17, with pattern challenges; learners can run BFS and DFS themselves on a graph from any start vertex |
| Duration | About 1 week from approval |
| Tasks | T-543, T-571, T-566, T-567, T-568, T-569, T-570 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-057, D-059, D-060, D-061, D-064, D-065 |

## Increment at the end of the sprint

- **Graph explorer (D-064):** a graph step can be marked as an explorer. The learner picks a start vertex and BFS or DFS, then steps or plays through the search computed in the browser; the graph shows the current vertex, visited vertices and travelled edges, and a strip shows the queue or the stack with the visit order.
- **Motion in every view (D-065), added at the PO's request:** markers slide between cells, swapped values trade places, changed values pop, tree nodes grow in with the root-to-marker path lit, linked-list pointers flip, and a stack strip shows pushes and pops.
- **Level 18 DFS & BFS Patterns:** lesson (choosing BFS or DFS, multi-source BFS, shortest paths on grids, topological order with in-degrees, two-colouring, and a first look at weighted shortest paths); a topological-order walkthrough on a directed graph, ending in the explorer; an intuition question; a quick check; 6 practice and 3 test problems.
- **Level 19 Backtracking:** lesson (the choose, explore, undo loop; subsets, permutations and combinations; pruning; the cost of exhaustive search); a walkthrough of building every subset on the tree view, where each node is a partial choice; an intuition question; a quick check; 6 practice and 3 test problems.
- Three pattern challenges for each level. Hard problems stay "Coming soon" (T-501).

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-543 Graph explorer | `visual.explore` in the content model and content check; explorer controls, BFS and DFS traces, frontier strip and visit order | Any vertex can be the start; BFS and DFS orders match reference traversals; fits a 375 px phone | Backend and frontend tests; screenshots |
| 2 | T-571 Motion in every view | Animation helpers for the cell, list and tree views; `visual.stack` in the content model and content check; stack strip | Motion only on top of a correct final drawing; nothing moves with reduced motion; Level 17 shows its stack as a strip | Frontend and backend tests; recording |
| 3 | T-566 Level 18 content | Lesson, walkthrough, intuition, quick check, 9 problems, Hard placeholders | Same content shape as Levels 4–17; every hidden test answer computed by JavaScript and Java reference solutions | Content check; reference runs; walkthrough replay test; screenshots |
| 4 | T-567 Level 18 pattern challenges | Three challenges | One best approach each | Content check; PO review |
| 5 | T-568 Level 19 content | As T-566 | As T-566 | As T-566 |
| 6 | T-569 Level 19 pattern challenges | Three challenges | As T-567 | As T-567 |
| 7 | T-570 Sprint 16 report | `docs/reports/sprint-16-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Levels 20–21 (Sprint 17), Vietnamese text (localization track), Hard problems (T-501).

## Risks

| Risk | Handling |
| --- | --- |
| Backtracking answers can be long lists whose order is not fixed | Problems ask for counts, or for lists in a stated order |
| Exhaustive searches can time out in hidden tests | Limits stay small (n up to about 10–12) |

## Work for the PO

- Review Levels 18 and 19 with the review checklist, and try the explorer from a few start vertices.

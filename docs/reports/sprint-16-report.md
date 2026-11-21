# Sprint 16 Report — Level 18 DFS & BFS Patterns and Level 19 Backtracking

| Field | Value |
| --- | --- |
| Sprint | Sprint 16 ([plan](../sprints/sprint-16.md)) |
| Dates | 2026-11-20 |
| Goal | Levels 18 and 19 are playable in the five-step lesson format at the standard of Levels 4–17, with pattern challenges; learners can run BFS and DFS themselves on a graph from any start vertex |
| Outcome | **Goal met; sprint closed 2026-11-20.** Merged to `main` in pull request #39 after PO review |

## Increment

- **Graph explorer (D-064):** the last step of the Level 18 walkthrough is interactive. The learner picks a start vertex and BFS or DFS, then steps or plays through the search; the graph shows the current vertex, visited vertices and travelled edges, and a strip shows the queue or the stack with the visit order.
- **Motion in every view (D-065):** markers slide between cells, swapped values trade places, changed values pop, linked-list pointers flip, tree nodes grow in with the root-to-marker path lit, and a stack strip shows pushes and pops (Level 17). Motion is skipped when the browser asks for reduced motion.
- **Level 18 DFS & BFS Patterns:** lesson (choosing BFS or DFS, grids, multi-source BFS, Kahn's topological order, two-colouring, a first look at weighted shortest paths); an 8-step Kahn walkthrough on a directed graph ending in the explorer; an intuition question; a quick check; 6 practice and 3 test problems.
- **Level 19 Backtracking:** lesson (choose, explore, undo; subsets, permutations, combinations; pruning); a 15-step walkthrough in which the decision tree for the subsets of [1, 2, 3] grows node by node; an intuition question; a quick check; 6 practice and 3 test problems.
- **Pattern challenges:** Build Order, Nearest Exit, Fastest Delivery Route; Meal Combo Builder, Seating Plan Search, Word in a Letter Grid.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-543 Graph explorer | `visual.explore` in the content model and content check; explorer controls, BFS and DFS traces, frontier strip, visit order | Trace unit tests; rendering test; screenshots on desktop and phone; PO review | PR #39 |
| T-571 Motion in every view | Animation helpers for the cell, list, tree and graph views; `visual.stack` and the stack strip | Frontend and backend tests; recording; PO review | PR #39 |
| T-566 Level 18 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson code compiles and runs; replay test against Kahn's algorithm; PO review | PR #39 |
| T-567 Level 18 pattern challenges | Three challenges | Content check; PO review | PR #39 |
| T-568 Level 19 content | As T-566 | As T-566; replay test against a preorder walk of the decision tree | PR #39 |
| T-569 Level 19 pattern challenges | Three challenges | Content check; PO review | PR #39 |
| T-570 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviewed both levels and the new features with the checklist and merged the pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 206 tests, 0 failed; content check includes Levels 18 and 19 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | Passed on `dev` |
| PO content review | 44 checklist items, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

- D-064 Interactive graph explorer.
- D-065 Motion in every walkthrough view.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| Large hidden-test inputs for grid problems approached the Java harness size limit | Grids reduced so each input stays under about 6,000 characters |
| A walkthrough prediction sat one step early | Moved to the step whose result it asks about |
| Strict index checks in TypeScript flagged tuple access in the animation code | Destructuring with defaults and explicit array types |

## Not done

- Vietnamese text for Levels 18 and 19 (localization track), Hard problems (T-501).

## Next sprint

Sprint 17: Level 20 Greedy & Intervals with an interval timeline view, and Level 21 Dynamic Programming Fundamentals. This closes Phase 2.

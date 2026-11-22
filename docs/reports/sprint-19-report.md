# Sprint 19 Report — Level 24 Graph & Grid Problem Solving and Level 25 Shortest Path & Topological Sort

| Field | Value |
| --- | --- |
| Sprint | Sprint 19 ([plan](../sprints/sprint-19.md)) |
| Dates | 2026-11-21 |
| Goal | Levels 24 and 25 are playable in the five-step lesson format at the standard of Levels 12–23, with pattern challenges; weighted graphs show the cost of each edge |
| Outcome | **Goal met; sprint closed 2026-11-21.** Merged to `main` in pull request #42 after PO review |

## Increment

- **Edge weights (D-069):** a graph step can label each edge with its cost; the label sits on a plate at the middle of the edge and lights up with it.
- **Level 24 Graph & Grid Problem Solving:** lesson (modelling grids, boards and combinations as graphs; multi-source BFS; search states with extra information; union-find); a walkthrough of multi-source BFS that fills a warehouse grid wave by wave on the table view; an intuition question; a quick check; 6 practice and 3 test problems.
- **Level 25 Shortest Path & Topological Sort:** lesson (Dijkstra and why negative edges break it, Bellman–Ford with an edge limit, 0-1 BFS, Kahn's algorithm by levels, longest paths in a DAG); a Dijkstra walkthrough on a weighted graph with each town's distance in its own column; an intuition question; a quick check; 6 practice and 3 test problems.
- **Pattern challenges:** Stadium Evacuation Map, Office Network Merge, Sliding Puzzle Solver; Delivery Time Estimate, Build Pipeline Order, Budget Flight Search.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-586 Edge weights | `visual.weights` in the content model and content check; labels on the graph view | Loader, content-check and rendering tests; screenshots; PO review | PR #42 |
| T-587 Level 24 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson code compiles and runs; replay test against multi-source BFS; PO review | PR #42 |
| T-588 Level 24 pattern challenges | Three challenges | Content check; PO review | PR #42 |
| T-589 Level 25 content | As T-587, on the weighted graph view | As T-587, with a replay test against Dijkstra | PR #42 |
| T-590 Level 25 pattern challenges | Three challenges | Content check; PO review | PR #42 |
| T-591 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviewed both levels and the edge weights with the checklist and merged the pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 206 tests, 0 failed; content check includes Levels 24 and 25 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| PO content review | 41 checklist items, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

- D-069 Edge weights on the graph view.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| A slip in the generator script while editing the Level 25 problem specs | Specs rebuilt from the intact part; every problem regenerated and both reference solutions rerun |
| Level 25 was planned with 9 problems but 8 were built at first | Fewest Terms added as the third Easy practice problem |
| Several hidden inputs were above about 6,000 characters | Graph and grid sizes reduced |
| One line of distances for six towns wrapped badly in the state table, mostly on phones | Each town's distance is its own value, so the table has one short column per town |

## Not done

- System Design content (T-585), Vietnamese text for levels, Hard problems (T-501).

## Next sprint

Sprint 20 closes Phase 3 with Level 26 Tries and Level 27 Interview Practice, and adds "Coming soon" sections on the Learning Path for Phase 4 System Design and an elective on design patterns.

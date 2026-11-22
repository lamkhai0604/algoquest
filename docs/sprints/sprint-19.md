# Sprint 19 — Level 24 Graph & Grid Problem Solving and Level 25 Shortest Path & Topological Sort

| Field | Value |
| --- | --- |
| Status | **Closed 2026-11-21** ([report](../reports/sprint-19-report.md)). Approved by the PO on 2026-11-21 |
| Goal | Levels 24 and 25 are playable in the five-step lesson format at the standard of Levels 12–23, with pattern challenges; weighted graphs show the cost of each edge |
| Duration | About 1 week from approval |
| Tasks | T-586, T-587, T-588, T-589, T-590, T-591 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-057, D-060, D-065, D-068, D-069 |

## Increment at the end of the sprint

- **Edge weights (D-069):** a graph step can label each edge with its cost.
- **Level 24 Graph & Grid Problem Solving:** lesson (modelling a problem as a graph: grids, states, implicit neighbours; multi-source BFS; BFS with extra state such as keys or remaining moves; union-find for connectivity); a walkthrough of multi-source BFS on a grid drawn with the table view; an intuition question; a quick check; 6 practice and 3 test problems.
- **Level 25 Shortest Path & Topological Sort:** lesson (Dijkstra with a priority queue, why it fails with negative edges, Bellman–Ford for few edges or a hop limit, topological order with Kahn's algorithm and with DFS, shortest paths in a DAG); a Dijkstra walkthrough on a weighted graph; an intuition question; a quick check; 6 practice and 3 test problems.
- Three pattern challenges for each level. Hard problems stay "Coming soon" (T-501).

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-586 Edge weights | `visual.weights` in the content model and content check; labels on the graph view | One label per edge, readable over the line and on a phone; the explorer still works | Backend and frontend tests; screenshots |
| 2 | T-587 Level 24 content | Lesson, walkthrough, intuition, quick check, 9 problems, Hard placeholders | Same content shape as Levels 12–23; every hidden test answer computed by JavaScript and Java reference solutions | Content check; reference runs; replay test; screenshots |
| 3 | T-588 Level 24 pattern challenges | Three challenges | One best approach each | Content check; PO review |
| 4 | T-589 Level 25 content | As T-587, on the weighted graph view | As T-587 | As T-587, with a replay test against Dijkstra |
| 5 | T-590 Level 25 pattern challenges | Three challenges | As T-588 | As T-588 |
| 6 | T-591 Sprint 19 report | `docs/reports/sprint-19-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Levels 26–27, System Design content (T-585), Vietnamese text for levels, Hard problems (T-501).

## Risks

| Risk | Handling |
| --- | --- |
| Dijkstra answers that overflow 32-bit integers | Weights and sizes keep distances below 2³¹, or the answer is returned as a count that fits |
| Large graph inputs exceed the Java harness size | Hidden inputs stay under about 6,000 characters |

## Work for the PO

- Review Levels 24 and 25 with the review checklist, including the weighted graph on a phone.

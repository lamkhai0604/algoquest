# Sprint 11 — Level 10 Graph Fundamentals

| Field | Value |
| --- | --- |
| Status | **Closed 2026-11-20** ([report](../reports/sprint-11-report.md)). Approved by the PO on 2026-11-20 |
| Goal | Level 10 is playable in the five-step lesson format at the standard of Levels 4–9, with a graph view in the walkthrough. Phase 1 (Levels 1–11) is then complete |
| Duration | About 1 week from approval |
| Tasks | T-538, T-539, T-540, T-542, T-541 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-052, D-056, D-057, D-060, D-061 |

## Increment at the end of the sprint

- **Graph view (D-060):** a walkthrough step can draw its cells as the vertices of a graph, with edges, optional arrows for directed edges, and visited vertices shaded. Phones and desktops use the same scalable drawing.
- **Level 10 Graph Fundamentals:** lesson (vertices and edges, directed and undirected, adjacency list and matrix, breadth-first search with a queue, depth-first search with recursion or a stack, a visited set, grids as graphs, connected components, shortest path in an unweighted graph), a walkthrough of breadth-first search on the graph view, an intuition question, a quick check, 6 practice problems, and 3 test problems.
- Three pattern challenges. Hard problems stay "Coming soon" (T-501).
- **Animated walkthroughs (D-061, added on 2026-11-20 at the PO's request):** Play and Pause with three speeds for every level; in the graph view, vertices pulse when first visited, travelled edges glow, the queue is a strip of vertices, and the last step colours vertices by distance from the start.

Graphs reach code runs as plain arrays (a vertex count and an edge list, or a grid), so the JavaScript runner and the Java harness need no new node class.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-538 Graph view | `visual.edges`, `directed`, `visited`, `positions` in the content model, content check and locale comparison; SVG graph drawing in the walkthrough | Invalid edges, positions or visited indices fail the content check; the drawing fits a 375 px screen | Backend and frontend tests; screenshots |
| 2 | T-539 Level 10 content | Lesson, walkthrough, intuition question, quick check, 9 problems with original stories, Hard placeholders | Same content shape as Levels 4–9; every hidden test answer computed by JavaScript and Java reference solutions; Java samples are complete classes | Content check; reference runs; walkthrough replay test; screenshots |
| 3 | T-540 Level 10 pattern challenges | Three challenges | Content check; one best approach each | Content check; PO review |
| 4 | T-542 Animated walkthroughs | Playback controls; `activeEdges`, `queue` and `rings` in the content model, content check and graph view | Playback holds at predictions and the last step; motion respects reduced-motion settings; an open prediction does not reveal the answer | Frontend and backend tests; screenshots and a short recording |
| 5 | T-541 Sprint 11 report | `docs/reports/sprint-11-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: weighted shortest paths and topological sort (Phase 2, Level 18), Vietnamese text (localization track), Hard problems (T-501), the live Java check (D-054).

## Risks

| Risk | Handling |
| --- | --- |
| New content is written by AI and may contain mistakes | Reference solutions compute every hidden answer; the PO reviews with the checklist |
| An automatic layout can draw crossing edges that confuse beginners | Walkthroughs give each vertex a position on a small grid; a circle layout is only the fallback |
| Deep recursion on large grids can overflow the stack | Problem limits stay small enough for recursion, and the lesson shows the iterative form |

## Work for the PO

- Review Level 10 with the review checklist.

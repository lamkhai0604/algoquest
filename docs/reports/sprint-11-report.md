# Sprint 11 Report — Level 10 Graph Fundamentals and Animated Walkthroughs

| Field | Value |
| --- | --- |
| Sprint | Sprint 11 ([plan](../sprints/sprint-11.md)) |
| Dates | 2026-11-20 |
| Goal | Level 10 is playable in the five-step lesson format at the standard of Levels 4–9, with a graph view in the walkthrough; Phase 1 (Levels 1–11) is complete |
| Outcome | **Goal met; sprint closed 2026-11-20.** Level 10, the graph view and animated walkthroughs were merged to `main` in pull request #34 after PO review. All 11 Phase 1 levels are playable in order |

## Increment

- **Graph view (D-060):** walkthrough visuals accept `edges`, `directed`, `visited` and `positions`, drawn as an SVG graph that fits a 375 px phone.
- **Animated walkthroughs (D-061), added during the sprint at the PO's request:** Play and Pause with three speeds for every level; in the graph view, new vertices pulse, travelled edges glow, the queue is a sliding strip, and the last step colours vertices by distance from the start. An open prediction keeps the previous graph state. Motion follows the reduced-motion setting.
- **Level 10 Graph Fundamentals:** lesson (adjacency lists and matrices, BFS, DFS, the visited set, connected components, grids as graphs), an 8-step BFS walkthrough with two predictions, an intuition question, a quick check, 6 practice problems, and 3 test problems.
- **Pattern challenges:** Subway Stops, Counting Lakes, Power Grid Islands.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-538 Graph view | Content model, content check, locale comparison, SVG drawing | Backend loader tests for valid and invalid graphs; frontend rendering test; phone layout check | PR #34 |
| T-539 Level 10 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; BFS replay test; PO review | PR #34 |
| T-540 Level 10 pattern challenges | Three challenges | Content check; PO review | PR #34 |
| T-542 Animated walkthroughs | Playback controls; `activeEdges`, `queue`, `rings` | Playback and animation tests; replay test checks the animation data; PO review | PR #34 |
| T-541 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviewed the content and the animation with the checklist and merged the pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 203 tests, 0 failed; content check includes Level 10 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | Passed on `dev` |
| PO content review | 22 checklist items, all OK |
| Records check | OK |

## Data changes

None. New walkthrough fields are optional content data.

## Decisions

- D-060 Graphs in the visualizer.
- D-061 Animated walkthroughs.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| The current vertex and visited vertices had the same colour | The current vertex keeps the highlight colour; visited vertices are green |
| A long line of walkthrough code scrolled sideways on phones | The step's code is split over several lines |
| The graph shading revealed the answer to an open prediction | While a prediction is open, the graph shows the previous step's state |
| Random test graphs were mostly disconnected, so most large answers were "unreachable" | The generator adds a sparse backbone; hidden answers now mix reachable and unreachable cases |

## Not done

- Interactive graph explorer with BFS and DFS side by side (T-543, planned for Level 18), live Java check (D-054), Hard problems (T-501), Vietnamese text for Level 10 (localization track).

## Next sprint

Sprint 12: portfolio preparation — a demo sign-in for visitors, a landing section on the sign-in page, link previews, and a README with a live demo link, recordings and an architecture overview.

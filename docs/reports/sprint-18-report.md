# Sprint 18 Report — Level 22 Mixed Pattern Problems and Level 23 1D & 2D Dynamic Programming

| Field | Value |
| --- | --- |
| Sprint | Sprint 18 ([plan](../sprints/sprint-18.md)) |
| Dates | 2026-11-21 |
| Goal | Phase 3 starts: Levels 22 and 23 are playable in the five-step lesson format at the standard of Levels 12–21, with pattern challenges; 2-D DP tables are drawn as tables; the main navigation announces the System Design track |
| Outcome | **Goal met; sprint closed 2026-11-21.** Merged to `main` in pull request #41 after PO review |

## Increment

- **System Design tab (D-067):** the last item of the main navigation, marked "Soon", opens a page with the planned topics. On phones narrower than 480 px the header wraps and the label is hidden.
- **Table view (D-068):** a walkthrough step can draw its cells as a labelled table; the cell being filled carries the marker, and the cells it reads are shaded and dotted. A prediction can now hide the marked cell's value until it is answered; the Level 21 walkthrough uses this, so its answer is no longer visible before the guess.
- **Level 22 Mixed Pattern Problems:** lesson (from limits to a target time, from signals to a pattern, checking an idea against brute force); a walkthrough that names the signal, pattern and time for seven statements; an intuition question; a quick check; 6 practice and 3 test problems whose statements do not name a pattern.
- **Level 23 1D & 2D Dynamic Programming:** lesson (2-D states, longest common subsequence, edit distance, grid paths, 0/1 knapsack, interval DP, keeping one row); a walkthrough that fills the LCS table on the table view; an intuition question; a quick check; 6 practice and 3 test problems.
- **Pattern challenges:** Ride Share Price Check, Server Alert Window, Warehouse Packing Speed; Search Box Spell Check, Delivery Van Loader, Gene Sequence Similarity.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-578 System Design tab | Navigation item, page, English and Vietnamese text | Frontend test; screenshots on desktop and phone; PO review | PR #41 |
| T-579 Table view | `visual.rows`, `rowLabels`, `columnLabels`, `reads` in the content model and content check; the table view; hidden marked cell | Loader, content-check and rendering tests; screenshots; PO review | PR #41 |
| T-580 Level 22 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson code compiles and runs; replay test; PO review | PR #41 |
| T-581 Level 22 pattern challenges | Three challenges | Content check; PO review | PR #41 |
| T-582 Level 23 content | As T-580, on the table view | As T-580, with a replay test of every cell against the LCS recurrence | PR #41 |
| T-583 Level 23 pattern challenges | Three challenges | Content check; PO review | PR #41 |
| T-584 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviewed both levels, the table view and the System Design page with the checklist and merged the pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 206 tests, 0 failed; content check includes Levels 22 and 23 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| PO content review | 43 checklist items, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

- D-067 System Design as a separate track, announced now and built later.
- D-068 Table view for 2-D walkthroughs.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| The extra navigation item made the header 26 px wider than a 375 px phone | The header wraps below 480 px and the "Soon" label is hidden there |
| New text keys were added in a namespace the typed key list does not cover | Moved under the existing `misc` namespace |
| The Level 21 walkthrough showed the dp value before the learner's guess | A prediction can hide the marked cell (`hides: ["cell"]`) |
| A Level 23 problem shared its title with an earlier problem | Renamed to Gift Card Split |
| The Level 22 state table repeated long problem text | Kept to signal, pattern and time; the text stays in each step |

## Not done

- System Design content (T-585), Vietnamese text for levels (localization track), Hard problems (T-501).

## Next sprint

Sprint 19: Level 24 Graph & Grid Problem Solving and Level 25 Shortest Path & Topological Sort, with edge weights on the graph view.

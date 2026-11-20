# Sprint 9 Report — Level 8 Trees & Binary Search Trees

| Field | Value |
| --- | --- |
| Sprint | Sprint 9 ([plan](../sprints/sprint-9.md)) |
| Dates | 2026-11-20 |
| Goal | Level 8 (Trees & Binary Search Trees) is playable in the five-step lesson format, with a visualizer that draws a binary tree, tree arguments in code runs, and pattern challenges |
| Outcome | **Goal met; sprint closed 2026-11-20.** Level 8, the tree visualizer, and `TreeNode` support are on `main`. The PO reviewed Level 8 and its pattern challenges with no corrections |

## Increment

- **Level 8 Trees & Binary Search Trees:** five-step lesson (terms, depth-first orders, level order, the BST rule, balance), a 6-step BST search walkthrough with two predictions, an intuition question, a quick check, 6 practice problems, and 3 test problems. Hard problems stay "Coming soon".
- **Tree visualizer:** a binary tree in array positions drawn as a scalable SVG with edges and marked nodes.
- **Binary trees in code runs (D-059):** `TreeNode` arguments and results in the JavaScript runner and the Java harness; tests use level-order arrays.
- **Pattern challenges:** Price Lookup, Deepest Folder, Org Chart Floors.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-528 Visualizer: binary tree | `visual.tree`, content check, `Tree` view | Content check tests; tree view test; Level 8 replay test; screenshots on desktop and phone | Yes |
| T-529 Tree arguments in code runs | Java signature marks trees; worker helpers; Java harness `TreeNode` | Helper tests; harness test compiles and runs tree code | Yes |
| T-530 Level 8 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; PO review | Yes |
| T-531 Level 8 pattern challenges | Three challenges | Content check; PO review | Yes |
| T-532 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviews and merges each `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 203 tests, 0 failed; content check includes Level 8 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | 6 passed |
| PO content review | 20 checklist items for Level 8, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

D-059 (binary trees in code runs and the visualizer).

## Problems and fixes

| Problem | Fix |
| --- | --- |
| A marker label under a tree node crossed the edges below it | The label has a halo in the card colour |

## Not done

- Live Java check (D-054), Hard problems (T-501), Vietnamese text for Level 8 (localization track).

## Next sprint

To be agreed with the PO.

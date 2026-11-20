# Sprint 6 Report — Level 5 Linked Lists

| Field | Value |
| --- | --- |
| Sprint | Sprint 6 ([plan](../sprints/sprint-6.md)) |
| Dates | 2026-11-19 |
| Goal | Level 5 (Linked Lists) is playable in the five-step lesson format at the Level 4 standard, with a visualizer that draws nodes and their `next` pointers, list arguments in code runs, and pattern challenges |
| Outcome | **Goal met; sprint closed 2026-11-19.** Level 5, the linked-node visualizer, and `ListNode` support are on `main`. The PO reviewed Level 5 and its pattern challenges with no corrections |

## Increment

- **Level 5 Linked Lists:** five-step lesson (nodes and pointers, walking a list, dummy node, in-place reversal, merging two sorted lists), a 7-step reversal walkthrough with two predictions, an intuition question, a quick check, 6 practice problems, and 3 test problems. Hard problems stay "Coming soon".
- **Linked-node visualizer:** each node shows its value and where `next` points, with arrows between neighbours; a node whose pointer changed is highlighted; a prediction can hide the pointers. One row on phones.
- **Linked lists in code runs (D-058):** `ListNode` arguments and results in the JavaScript runner and the Java harness; tests stay plain arrays; a cycle stops with an error.
- **Pattern challenges:** Backwards Tour, Two Sorted Queues, Skip Closed Stations.
- **Site name as one variable:** `VITE_APP_NAME`, default AlgoQuest (added during the sprint at the PO's request; in a separate pull request).

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-518 Visualizer: linked nodes | `visual.next`, content check, `Nodes` view | Content check tests; frontend test for the view; replay test of the Level 5 reversal; screenshots | Yes |
| T-519 List arguments in code runs | Java signature marks lists; worker helpers; Java harness `ListNode` | Helper tests; harness test compiles and runs list code and stops at a cycle | Yes |
| T-511 Level 5 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; PO review | Yes |
| T-520 Level 5 pattern challenges | Three challenges | Content check; PO review | Yes |
| T-521 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviews and merges each `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 202 tests, 0 failed; formatting clean |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | 6 passed |
| PO content review | 20 checklist items for Level 5, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

D-058 (linked lists in code runs).

## Problems and fixes

| Problem | Fix |
| --- | --- |
| The code setup failed for a test problem whose Java starter has no method | No lists are assumed when the signature cannot be read |
| Helper functions passed to the worker as `Function.toString()` would break after minification | The helpers are kept as source text |
| Three nodes wrapped onto two rows on phones | Smaller node padding on narrow screens |

## Not done

- Live Java check (D-054), Hard problems (T-501), Vietnamese text for Level 5 (localization track).

## Next sprint

Sprint 7: Level 6 Stack, Queue & Deque.

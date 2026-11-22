# Sprint 21 Report — Lesson Figures and Layout Fixes

| Field | Value |
| --- | --- |
| Sprint | Sprint 21 ([plan](../sprints/sprint-21.md)) |
| Dates | 2026-11-21 |
| Goal | Core lessons explain data structures with drawings, and the walkthrough and form buttons have a stable, well-spaced layout |
| Outcome | **Goal met except decorative images; sprint closed 2026-11-21.** Merged to `main` in pull request #49. The images (T-603) wait on the PO and move to Later |

## Increment

- **Walkthrough layout:** Back, Next step, Reset, Play and Speed sit at the top of the step card, so the Next step button stays in one place on every step. Before, it moved by up to about 390 px between steps.
- **Button spacing:** a button that follows other content in a card has 16px of space above it.
- **Lesson figures (D-072):** a `figure` block in `lesson.md` draws 2 to 6 frames (stack, queue, or any walkthrough drawing). Play lights the frames in a loop until Stop; nothing plays by itself.
- **Figures in seven core lessons:** arrays (insert, grid moves), hashing (buckets and a collision), linked lists (insert, reverse), stack and queue, BST search, heap push, BFS rings.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-600 Layout | Controls above the drawing; card button spacing | Frontend tests; before and after screenshots on desktop and phone; PO review | PR #49 |
| T-601 Figure block | Frontend component, backend model and check, English and Vietnamese labels | Backend and frontend tests (Play loops, Stop ends it); PO review | PR #49 |
| T-602 Core lesson figures | 10 figures in Levels 2, 3, 5, 6, 8, 9 and 10 | Content test replays stack and queue frames; screenshots; PO review | PR #49 |
| T-603 Decorative images | Prompts, file names and alt text in [lesson-images.md](../lesson-images.md) | — | Moved to Later: waiting on the images |
| Sprint report | This document | Records check | With this report |

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 208 tests, 0 failed; content check includes every figure |
| Frontend (lint, format, typecheck, tests, build) | Green, including the lesson figure content test |
| Records check | OK |

## Data changes

None.

## Decisions

- D-072 Figures inside lessons; controls above the walkthrough drawing; button spacing in cards.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| On phones, the controls still moved when a taller step first appeared below them | Controls moved above the drawing instead of below it |
| Lesson list styles laid out the cells of drawings inside figures vertically | Lesson list styles apply only to the lesson's own lists |
| The explorer test pressed the walkthrough's Next step after the controls moved | The test presses the explorer's own button |
| Tests could not read `lesson.md` files as raw text | Vite allows the `content` folder |

## Next

Feature work pauses while the PO tests the existing levels and features. Fixes from that review come first; Phase 4 System Design follows.

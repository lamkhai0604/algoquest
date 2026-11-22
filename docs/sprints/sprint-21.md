# Sprint 21 — Lesson figures and layout fixes

| Field | Value |
| --- | --- |
| Status | Approved by the PO on 2026-11-21 |
| Goal | Core lessons explain data structures with drawings, and the walkthrough and form buttons have a stable, well-spaced layout |
| Duration | About 3 days from approval |
| Tasks | T-600, T-601, T-602, T-603, T-604 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03; decisions D-060, D-065, D-068, D-072 |

## Increment at the end of the sprint

- **Walkthrough layout (T-600):** Back, Next step, Reset, Play and Speed sit at the top of the step card, above the drawing, so they stay in the same place on every step. Buttons that follow text in a card have 16px of space above them.
- **Lesson figures (T-601):** a `figure` block in `lesson.md` draws 2 to 6 frames. Play lights the frames one by one in a loop until Stop.
- **Core lessons (T-602):** figures in Levels 2, 3, 5, 6, 8, 9 and 10.
- **Decorative images (T-603):** added when the PO supplies them.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-600 Layout | Walkthrough card, card buttons | The Next step button keeps its position on every step; 16px above buttons after text | Frontend tests; before and after screenshots |
| 2 | T-601 Figure block | Frontend component, backend model and check, i18n | Invalid figures fail the content check; Play loops and Stop ends it; no autoplay; reduced motion respected | Backend and frontend tests |
| 3 | T-602 Core lesson figures | Seven lessons | Each figure matches its lesson text; stack and queue frames follow from each other | Content tests; screenshots |
| 4 | T-603 Images | Prompts and file names | Each image has alt text and is a `.webp` under `frontend/public/lesson-images/` | Content test; PO review |

Out of scope: figures for Levels 11–27 (later, as needed); Vietnamese lesson text.

## Risks

| Risk | Handling |
| --- | --- |
| Wide drawings do not fit on a phone | Frames wrap to fewer columns; linked lists use one frame per row |
| Lesson list styles change the drawings | Lesson list styles apply only to the lesson's own lists |

## Work for the PO

- Review the layout and the figures with the review checklist.
- Create the decorative images from the prompt list (T-603).

# Sprint 13 — Level 12 Two Pointers and Level 13 Sliding Window

| Field | Value |
| --- | --- |
| Status | **Closed 2026-11-20** ([report](../reports/sprint-13-report.md)). Approved by the PO on 2026-11-20 |
| Goal | Phase 2 starts: Levels 12 and 13 are playable in the five-step lesson format at the standard of Levels 4–11, with pattern challenges |
| Duration | About 1 week from approval |
| Tasks | T-550, T-551, T-552, T-553, T-554, T-555 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-052, D-056, D-057, D-063 |

## Increment at the end of the sprint

- **Window range (D-063):** a cell-view step may shade a range of cells, so a sliding window or the span between two pointers is visible at a glance; it animates with the other cell changes.
- **Level 12 Two Pointers:** the parked lesson from the former level order, rewritten to the current lesson structure (objectives, intuition, when to use, templates in JavaScript and Java, complexity, mistakes, edge cases, worked example); a walkthrough on the cell view; an intuition question; a quick check; 6 practice and 3 test problems, each re-checked by JavaScript and Java reference solutions.
- **Level 13 Sliding Window:** fixed-size and variable-size windows, the window invariant, counting with a hash map inside the window; a walkthrough with the window shaded; an intuition question; a quick check; 6 practice and 3 test problems.
- Three pattern challenges for each level. Hard problems stay "Coming soon" (T-501).

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-550 Window range | `visual.window` in the content model, content check, locale comparison and cell view | A window outside the cells fails the content check; the shading fits a 375 px phone | Backend and frontend tests; screenshots |
| 2 | T-551 Level 12 content | Move the parked files into the level folder, rename IDs, rewrite the lesson, add the walkthrough visuals, intuition and placeholders | Same content shape as Levels 4–11; every hidden test answer recomputed by JavaScript and Java reference solutions | Content check; reference runs; walkthrough replay test; screenshots |
| 3 | T-552 Level 12 pattern challenges | Three challenges | One best approach each | Content check; PO review |
| 4 | T-553 Level 13 content | Lesson, walkthrough, intuition, quick check, 9 problems with original stories, Hard placeholders | As T-551 | As T-551 |
| 5 | T-554 Level 13 pattern challenges | Three challenges | As T-552 | As T-552 |
| 6 | T-555 Sprint 13 report | `docs/reports/sprint-13-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Levels 14–21 (later sprints), Vietnamese text (localization track), Hard problems (T-501).

## Risks

| Risk | Handling |
| --- | --- |
| The parked problems were written before reference solutions were required | Each gets JavaScript and Java reference solutions; any answer that changes is reported |
| Two pointers and sliding window overlap, so problems could feel repeated | Level 12 covers pairs from both ends and read/write pointers; Level 13 covers contiguous ranges only |

## Work for the PO

- Review Levels 12 and 13 with the review checklist.

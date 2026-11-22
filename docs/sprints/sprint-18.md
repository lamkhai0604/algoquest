# Sprint 18 — Level 22 Mixed Pattern Problems and Level 23 1D & 2D Dynamic Programming

| Field | Value |
| --- | --- |
| Status | Approved by the PO on 2026-11-21 |
| Goal | Phase 3 starts: Levels 22 and 23 are playable in the five-step lesson format at the standard of Levels 12–21, with pattern challenges; 2-D DP tables are drawn as tables; the main navigation announces the System Design track |
| Duration | About 1 week from approval |
| Tasks | T-578, T-579, T-580, T-581, T-582, T-583, T-584 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-057, D-065, D-067, D-068 |

## Increment at the end of the sprint

- **System Design tab (D-067):** the last item of the main navigation, marked "Soon", opens a page with the planned topics. No content or XP yet.
- **Table view (D-068):** a walkthrough step can draw its cells as a table with row and column labels; the cell being filled carries the marker and the cells it reads are shaded.
- **Level 22 Mixed Pattern Problems:** lesson on recognizing the pattern from the problem's signals (input shape, what is asked, limits), a checklist from constraints to complexity, and how to test an idea on a small case before coding; a walkthrough that sorts problem statements into patterns; an intuition question; a quick check; 6 practice and 3 test problems whose statements do not name the pattern.
- **Level 23 1D & 2D Dynamic Programming:** lesson (2-D states over two strings or a grid, longest common subsequence, edit distance, 0/1 knapsack, reducing a 2-D table to one row); a walkthrough that fills the longest-common-subsequence table on the table view; an intuition question; a quick check; 6 practice and 3 test problems.
- Three pattern challenges for each level. Hard problems stay "Coming soon" (T-501).

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-578 System Design tab | Navigation item, page, English and Vietnamese text | Last item of the navigation, marked "Soon"; the page says the track is coming and lists the topics | Frontend test; screenshot |
| 2 | T-579 Table view | `visual.rows`, `visual.rowLabels`, `visual.columnLabels`, `visual.reads` in the content model and content check; the table view with motion | Labels line up with cells; read cells and the marker are visible without colour alone; fits a 375 px phone | Backend and frontend tests; screenshots |
| 3 | T-580 Level 22 content | Lesson, walkthrough, intuition, quick check, 9 problems, Hard placeholders | Same content shape as Levels 12–21; statements do not name the pattern; every hidden test answer computed by JavaScript and Java reference solutions | Content check; reference runs; replay test; screenshots |
| 4 | T-581 Level 22 pattern challenges | Three challenges | One best approach each | Content check; PO review |
| 5 | T-582 Level 23 content | As T-580, on the table view | As T-580 | As T-580 |
| 6 | T-583 Level 23 pattern challenges | Three challenges | As T-581 | As T-581 |
| 7 | T-584 Sprint 18 report | `docs/reports/sprint-18-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: System Design content (T-585), Levels 24–27, Vietnamese text for levels (localization track), Hard problems (T-501).

## Risks

| Risk | Handling |
| --- | --- |
| Mixed problems that can be solved several ways make grading of the explanation unfair | Each problem's key accepts every approach within the target complexity and lists the slower ones as alternatives |
| 2-D tables do not fit a phone | Walkthrough tables stay at most 7 × 7 cells; the view scrolls inside its card if needed |

## Work for the PO

- Review Levels 22 and 23 with the review checklist, including the table view and the System Design page on a phone.

# Sprint 24 Report — Code Lines and the Recursion Staircase

| Field | Value |
| --- | --- |
| Sprint | Sprint 24 ([plan](../sprints/sprint-24.md)) |
| Dates | 2026-11-23 to 2026-11-24 |
| Goal | Walkthroughs show which line of code each step runs, and recursion is drawn as a staircase of calls |
| Outcome | **Goal met; sprint closed 2026-11-24.** Code lines and the staircase merged to `main` in pull request #62. After the PO review, the code lines were extended to the other walkthroughs (T-617) |

## Increment

- **Running code lines (D-077):** the first step of a walkthrough shows one whole function; each step lights the lines it runs, with line numbers, and keeps the lit line in view.
- **24 of 27 walkthroughs use it.** Level 22 (pattern recognition) has no single algorithm to follow; Level 27 follows the two-sum function during the trace and keeps its own snippets for the other interview stages.
- **Recursion staircase (D-078):** Level 7 draws each call of `sum` as a box indented by its depth, running, waiting or done with its result. During a prediction the fresh result shows as "?".
- **Small fixes:** the sign-in page names 27 levels; loading notices show placeholder bars.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-613 Code lines | Step field, content check, code panel; Levels 7 and 15 | Backend and frontend tests; Level 7 content test; PO review | PR #62 |
| T-614 Staircase | Visual field, content check, drawing and motion; Level 7 | Backend and frontend tests; content test against a reference sum; PO review | PR #62 |
| T-615 Small fixes | Sign-in text in both languages; loading placeholder bars | Frontend tests; PO review | PR #62 |
| T-617 Code lines, other levels | Whole functions and line ranges for 22 more walkthroughs and the Vietnamese Level 1 walkthrough | Content check of every range in CI | Release pull request after this report |
| T-616 Report | This document | Records check | With the release pull request |

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | Green; the content check validates the line range of every step in every walkthrough |
| Frontend (lint, format, typecheck, tests, build) | Green, including the Level 7 and Level 15 content tests |
| Smoke (Playwright) | Green |
| Records check | OK |

## Data changes

None.

## Decisions

- D-077 Running lines in walkthrough code.
- D-078 Recursion staircase.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| The local formatter's version wrote `for (;; )` loops differently from CI | The two lines were restored to the CI format |
| A step-only snippet would have replaced the whole function in view | Steps that follow a function drop their own snippet and set only `lines` |

## Next

Phase 4, System Design: planning with the PO before any build.

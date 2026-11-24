# Sprint 24 — Code lines and the recursion staircase

| Field | Value |
| --- | --- |
| Status | Closed 2026-11-24 ([report](../reports/sprint-24-report.md)) |
| Goal | Walkthroughs show which line of code each step runs, and recursion is drawn as a staircase of calls |
| Duration | About 1 day from approval |
| Tasks | T-613, T-614, T-615, T-616, T-617 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-01, FR-03, NFR-05; decisions D-077, D-078 |

## Increment at the end of the sprint

- **Code panel:** a step can light the lines it runs in a whole function shown once; Levels 7 and 15 use it.
- **Recursion staircase:** the Level 7 walkthrough draws each call of `sum` as a box, indented by depth, with its state and the value it returns.
- **Small fixes:** the sign-in page names 27 levels; loading notices show placeholder bars.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-613 Code lines | Step field, validation, code panel, Levels 7 and 15 | The lit lines follow each step; the code stays in view on steps without their own code; invalid lines are refused | Backend and frontend tests; content test |
| 2 | T-614 Staircase | Visual field, validation, drawing, motion, Level 7 | Calls are indented by depth; one call at most is active; results stay hidden during a prediction; Level 7 matches a reference sum | Backend and frontend tests; content test |
| 3 | T-615 Small fixes | Sign-in text, loading bars | Text names 27 levels in both languages; loading notices keep their label for screen readers | Frontend tests |
| 4 | T-616 Report | Sprint report | — | Records check |

Out of scope: pixel characters (an optional style, planned after this sprint); code lines for the other 25 levels, which follow level by level.

## Work for the PO

- Open Level 7 and Level 15 walkthroughs on a computer and a phone; merge the pull request.

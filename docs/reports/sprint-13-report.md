# Sprint 13 Report — Level 12 Two Pointers and Level 13 Sliding Window

| Field | Value |
| --- | --- |
| Sprint | Sprint 13 ([plan](../sprints/sprint-13.md)) |
| Dates | 2026-11-20 |
| Goal | Phase 2 starts: Levels 12 and 13 are playable in the five-step lesson format at the standard of Levels 4–11, with pattern challenges |
| Outcome | **Goal met; sprint closed 2026-11-20.** Merged to `main` in pull request #36 after PO review |

## Increment

- **Window range (D-063):** the cell view shades a range of cells with a "Window [a]–[b] · size n" note.
- **Level 12 Two Pointers:** the parked lesson rewritten to the current structure; a 7-step pair-sum walkthrough with the search range shaded; an intuition question; a quick check; 6 practice and 3 test problems.
- **Level 13 Sliding Window:** lesson (fixed and variable windows, window state, when shrinking fails); a 7-step longest-unique-run walkthrough; an intuition question; a quick check; 6 practice and 3 test problems.
- **Pattern challenges:** Gift Budget Pair, Cleaning a Sensor Log, Two Sorted Playlists; Highest Heart Rate Minute Block, Longest Run of Unique Codes, Shortest Fundraising Stretch.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-550 Window range | Content model, content check, locale comparison, cell view | Loader tests for valid and invalid ranges; rendering test | PR #36 |
| T-551 Level 12 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | All hidden answers recomputed by JavaScript and Java reference solutions; lesson code compiles and runs; replay test; PO review | PR #36 |
| T-552 Level 12 pattern challenges | Three challenges | Content check; PO review | PR #36 |
| T-553 Level 13 content | As T-551, new problems | As T-551 | PR #36 |
| T-554 Level 13 pattern challenges | Three challenges | Content check; PO review | PR #36 |
| T-555 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviewed both levels with the checklist and merged the pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 206 tests, 0 failed; content check includes Levels 12 and 13 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | Passed on `dev` |
| PO content review | 40 checklist items, all OK |
| Records check | OK |

## Data changes

None.

## Decisions

- D-063 Window range in the cell view.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| One parked pair-sum test had three valid pairs, so a correct answer could fail | The test was replaced and the statement now says at most one pair exists |
| The parked problems had only small hidden tests | Larger hidden tests were added and answered by both reference solutions |
| A long walkthrough code line scrolled sideways on phones | The line is split |

## Not done

- Vietnamese text for Levels 12 and 13 (localization track), Hard problems (T-501).

## Next sprint

Sprint 14: Level 14 Prefix Sum & Range Queries and Level 15 Binary Search.

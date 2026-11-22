# Sprint 20 Report — Level 26 Tries and Level 27 Interview Practice; Phase 3 Summary

| Field | Value |
| --- | --- |
| Sprint | Sprint 20 ([plan](../sprints/sprint-20.md)) |
| Dates | 2026-11-21 |
| Goal | Phase 3 is complete: Levels 26 and 27 are playable in the five-step lesson format at the standard of Levels 12–25, with pattern challenges; the Learning Path shows Phase 4 System Design and a design patterns elective as "Coming soon" |
| Outcome | **Goal met; sprint closed 2026-11-21.** Merged to `main` in pull request #44 after PO review; the header change (T-599) in pull requests #47 and #48 |

## Increment

- **Learning Path (D-070):** below Phase 3, a "Phase 4 · System Design" section and an "Elective · Design Patterns" section, each with its goal and a "Coming soon" badge.
- **Level 26 Tries:** lesson, a walkthrough that inserts words into a trie drawn on the graph view with letters on the edges, an intuition question, a quick check, 6 practice and 3 test problems.
- **Level 27 Interview Practice:** lesson on a repeatable interview routine, a walkthrough that runs the routine on one problem, an intuition question, a quick check, 6 practice and 3 test problems that mix earlier patterns.
- **Pattern challenges:** three for each level.
- **Header (D-071):** the main navigation holds only Map and Knowledge; streak, XP and hints are in a progress menu; name, Profile, Admin, language, theme and sign-out are in an account menu.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-592 Learning Path sections | Phase 4 and elective sections, English and Vietnamese | Frontend test; screenshots; PO review | PR #44 |
| T-593 Level 26 content | Lesson, walkthrough, intuition, quick check, 9 problems, placeholders | Hidden answers computed by JavaScript and Java reference solutions; lesson code compiles and runs; replay test against trie insertion; PO review | PR #44 |
| T-594 Level 26 pattern challenges | Three challenges | Content check; PO review | PR #44 |
| T-595 Level 27 content | As T-593 | As T-593, with a replay test of the routine | PR #44 |
| T-596 Level 27 pattern challenges | Three challenges | Content check; PO review | PR #44 |
| T-599 Header | Progress and account menus; navigation of Map and Knowledge | Frontend tests; screenshots on desktop and phone; PO review | PR #47, PR #48 |
| T-597 Sprint report and Phase 3 summary | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviewed both levels, the Learning Path sections and the header with the checklist and merged the pull requests.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | Green; content check includes Levels 26 and 27 |
| Frontend (lint, format, typecheck, tests, build) | Green |
| PO content review | 41 checklist items for the levels, all OK; header OK |
| Records check | OK |

## Data changes

None.

## Decisions

- D-070 Phase 4 and elective sections on the Learning Path.
- D-071 A tidier header (replaces the navigation part of D-067).

## Problems and fixes

| Problem | Fix |
| --- | --- |
| A Level 26 problem had 7 tests, one below the minimum | One test added |
| One Level 26 problem was skipped by the build after an earlier error | Built and checked with both reference solutions |
| The header grew to nine items and wrapped on laptops | Menus for progress and account (D-071) |
| A push to `dev` was rejected after another change landed there | `origin/dev` merged in cleanly and CI run again |

## Not done

- System Design content (T-585), design patterns content (T-598), Vietnamese text for levels, Hard problems (T-501).

## Phase 3 summary (Levels 22–27)

Phase 3, Interview Mastery, ran from Sprint 18 to Sprint 20 and delivered six levels: Mixed Pattern Problems, 1D & 2D Dynamic Programming, Graph & Grid Problem Solving, Shortest Path & Topological Sort, Tries, and Interview Practice. With it, the core path of Levels 1–27 is complete.

| Measure | Result |
| --- | --- |
| Levels delivered | 6 (Levels 22–27), each with lesson, walkthrough, intuition, quick check, 6 practice and 3 test problems, and 3 pattern challenges |
| Problems with hidden tests | 54, every answer computed by two independent reference solutions (JavaScript and Java) |
| Pattern challenges | 18 |
| New visual tools | Table view for 2-D walkthroughs and a prediction that hides the marked cell (D-068), edge weights (D-069) |
| Product | Phase 4 and elective announced on the Learning Path (D-070); tidier header (D-071) |

## Next

Sprint 21 added lesson figures and layout fixes ([report](sprint-21-report.md)). After it, feature work pauses while the PO tests Levels 1–27 and the existing features. Phase 4 System Design starts after that review.

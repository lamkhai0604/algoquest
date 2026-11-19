# Sprint 5 Report — Level 4 and the Profile Page

| Field | Value |
| --- | --- |
| Sprint | Sprint 5 ([plan](../sprints/sprint-5.md)), with the scope extension approved on 2026-11-17 |
| Dates | 2026-11-14 to 2026-11-19 |
| Goal | Level 4 (Sorting Fundamentals) is playable in the five-step lesson format and becomes the reference for later levels; the profile page is redesigned; Levels 1–3 content is reviewed by the PO; Java code runs on the live site |
| Outcome | **Goal met except the live Java check; sprint closed 2026-11-19.** Level 4, the profile page, and the Pattern Recognition pilot are on `main`. The PO reviewed Levels 1–4 and the six pattern challenges with no corrections. Java runs stay off because Judge0 has no free plan (D-054) |

## Increment

- **Level 4 Sorting Fundamentals:** five-step lesson (why sorting helps, insertion sort, merge sort, built-in sort with a comparator, stability), an insertion sort walkthrough with swaps, an intuition question, a quick check, 6 practice problems, and 3 test problems. Hard problems stay "Coming soon".
- **Visualizer swaps:** a walkthrough step can highlight two swapped cells; the content check rejects bad indices.
- **Profile page:** hero with level and streak, stat tiles, and progress by phase, on desktop and phone (D-053). The name in the header opens it.
- **Owner test access:** the Owner can open every level for testing (D-055); players are unaffected.
- **Pattern Recognition pilot (D-057):** two or three challenges on the Level 3 and 4 pages. The player picks an approach and explains why; the content label (best, valid, unsuitable) decides correctness, and the AI grades only the reason and the complexity. A comparison table follows. No XP; 5 answers per challenge per day; the Owner can review the answers.
- **Curriculum map:** the 17-topic outline mapped to the 27 fixed level numbers (D-056).
- **Interface:** Battle mode shown like an upcoming phase.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-402 Live Java check | Java hidden while no Judge0 key is set (D-054) | Runner tests with a fake runner | Yes; **live check not done** |
| T-415 Levels 1–3 content review | PO review with a 74-item checklist, Level 4 and the pattern challenges included | All items OK | Not applicable |
| T-508 Review corrections | None needed | Review result | Not applicable |
| T-509 Visualizer swaps | `swap` on a walkthrough step, highlight in the visualizer | Content check for indices; frontend test replays the Level 4 swaps | Yes |
| T-510 Level 4 content | Lesson, walkthrough, intuition, quick check, 9 problems | Hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles; PO review | Yes |
| T-414 Profile page | Layout chosen by Claude as delegated by the PO (D-053) | Frontend tests; screenshots | Yes |
| T-512 Grading latency (NFR-04) | `grader-check` workflow running `RealGraderCheck` | Median 885 ms, slowest 1,458 ms on 2026-11-16 | Yes |
| T-514 Owner test access | `game.allLevels` permission | API tests for the Owner and a player | Yes |
| T-515 Curriculum map | [CURRICULUM-MAP.md](../CURRICULUM-MAP.md) | Records check | Yes |
| T-516 Pattern Recognition demo | Standalone demo page | PO tried and approved it | Not applicable |
| T-517 Pattern Recognition pilot | Content schema and validator, six challenges, API, `pattern_attempt`, level page section and challenge page | API and grader tests; live Gemini check 6 of 6 as expected; PO review | Yes |
| T-513 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO reviews and merges each `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 199 tests, 0 failed; formatting clean |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | 6 passed |
| Live grader check (Gemini) | Explanation grader 5 of 5 in range, median 2,549 ms, slowest 6,487 ms; pattern grader 6 of 6 as expected (clear 100, valid alternative 100, vague 30, unsuitable with an honest reason 80, Vietnamese 100, prompt injection 0) |
| Records check | OK |

## Data changes

V14 `pattern_attempt` adds a table only.

## Decisions

D-053 (profile layout), D-054 (Java off until a Judge0 key is set), D-055 (Owner test access), D-056 (fixed level numbers), and D-057 (Pattern Recognition pilot).

## Problems and fixes

| Problem | Fix |
| --- | --- |
| Judge0 on RapidAPI has no free plan any more | Java hidden in the editor until a key is set (D-054) |
| The GitHub `GEMINI_API_KEY` secret was invalid | The PO replaced it; Gemini's error status is now logged |
| Gemini returned HTTP 503 (high demand) and one 20 s timeout during the live checks | Reran later; both checks passed |
| A frontend test asserted the heartbeat too early | The assertion waits for the update |

## Not done

- **Live Java check (T-402):** paused by D-054.
- Level 5 and later levels (T-511, T-502), deferred by the sprint plan.

## Next sprint

Sprint 6 proposal follows: Level 5 Linked Lists with the linked-node visualizer (T-511), using Level 4 as the standard, and pattern challenges for the new level if the pilot keeps working well.

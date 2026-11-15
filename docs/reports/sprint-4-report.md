# Sprint 4 Report — Code and Rules

| Field | Value |
| --- | --- |
| Sprint | Sprint 4 ([plan](../sprints/sprint-4.md)), with Side Sprint S-1 run inside it |
| Dates | 2026-11-12 to 2026-11-14 |
| Goal | After a passing explanation, a player can write code in JavaScript or Java and double the problem's XP; the Owner can tune the game rules without a deployment; the rules and code flow are finished as the template for later levels |
| Outcome | **Goal met for JavaScript and the game rules; sprint closed 2026-11-14.** Java runs through Judge0 in tests with a fake runner; the live Java check waits for the Judge0 key on Render. Side Sprint S-1 rebuilt Levels 1–3 for beginners (T-409 to T-413). Open: PO content review of Levels 1–3 (T-415) |

## Increment

- **Code for 2× XP:** a solved problem offers an in-page editor (D-046) in JavaScript or Java. JavaScript runs in the browser in a Web Worker with a time limit; the browser gets only test inputs and the server compares the outputs (D-035). Java runs on Judge0 with a daily quota guard and a clear message when the quota is used up (D-032). Passing every hidden test doubles the problem's XP once.
- **Game rules in the database:** XP values, time limits, hint quota, pass mark, practice and quick check XP, and the level target are one configuration record read at runtime (D-047). The Owner edits it on an admin page; each change is audit-logged with before and after values.
- **Admin pages:** game rules, users and roles, and the audit log.
- **Placeholders:** Hard mode on the level-up test and Battle mode on the home page, both marked "Coming soon".
- **Learning Path (Side Sprint S-1):** 27 levels in three phases (D-048). The home page has a Continue card and one section per phase. Phases with no open level show only a header with "Coming soon" (D-050).
- **Five-step lessons (Side Sprint S-1):** Understand, Visualize, Learn, Check, Practice (D-049). The visualizer shows the array, markers, variables, and a state table, and asks for predictions before revealing a step. Understand has an ungraded intuition question (D-051). Learn has collapsible sections and one code language at a time with a Copy button (D-052).
- **Content (Side Sprint S-1):** Level 1 extended with loop counting, growth rates, and edge cases; Level 2 is now Arrays & Strings with 9 new problems; Level 3 is Hashing with the former Level 2 problems plus Group by Letters. Two Pointers content is parked for Level 12.
- **Interface:** site footer, "Back" on the lesson step buttons, spacing around action buttons, and a header that wraps on phones.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-401 Code editor and JavaScript runner | Editor, test inputs endpoint, Web Worker runner, code run endpoint, code bonus once | Expected outputs never reach the browser; wrong or timed-out runs award nothing; bonus once (tests); smoke runs real JavaScript | Yes |
| T-402 Java runner on Judge0 | `CodeRunner` interface, Judge0 client with a timeout, generated harness, daily quota guard | Quota reached and Judge0 errors with a fake runner (tests) | Yes; **live check open** |
| T-404 Placeholders | Hard mode and Battle mode placeholders | Disabled buttons; screenshots | Yes |
| T-405 Admin panel part 2 | `game_config` table, rules editor, users and roles, audit log view | Changes apply on the next request and are audited; players get 403 (tests) | Yes |
| T-406 Design pass | Level map mockups A, B, C; layout B applied with lesson and phone layouts | PO selection; screenshots | Yes; profile moved to T-414 |
| T-407 XP tuning | Defaults kept (D-040); the rules page rejects invalid values | Tests for the limits | Yes |
| T-408 Sprint report | This document | Records check | With this report |
| T-409 Curriculum and migration | Phases in `levels.json`, phase-order check, V13 | Content check tests; backend tests | Yes |
| T-410 Learning Path and five-step lessons | Home page, lesson steps, visualizer with predictions | Frontend tests check each walkthrough against a reference run; smoke covers the steps | Yes |
| T-411 Levels 1–3 content | Lessons, walkthroughs, quick checks, problems | Hidden test answers computed by JavaScript and Java reference solutions; content check in CI | Yes; **PO review open (T-415)** |
| T-412 Review fixes | Locked phases, upcoming tiles, Back button, spacing, Copy button, footer | Frontend tests; smoke; screenshots | Yes |
| T-413 Intuition question and Learn step | `intuition.json`, collapsible sections, language switch, complete Java samples | Loader and API tests; frontend tests; every Java block compiles and matches the JavaScript results | Pull request to `main` with this report |

Review: all tasks are self-reviewed. The PO reviews and merges each `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 178 tests, 0 failed; formatting clean |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | 5 passed, including the five lesson steps and a JavaScript code run |
| Local development job | Backend healthy following the README steps |
| Records check | OK |

## Data changes

- V11 `code_run` and V12 `game_config` add tables only.
- V13 clears progress, quick checks, and level-up test results for levels 2 and 3, because those levels changed topic (D-048). Graded attempts, code runs, and hint use are kept, and Level 1 is untouched.

## Decisions

D-046 and D-047 were approved with the sprint plan. Side Sprint S-1 added D-048 to D-052: the 27-level curriculum, the Learning Path and five-step lessons, hidden upcoming levels, the intuition question, and one code language at a time.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| Walkthrough hooks ran after an early return | Hooks moved before the return |
| Arrow keys stopped working after a button was disabled | The key listener moved to the document and ignores text fields |
| The step bar and header overflowed on phones | Numbered steps with a caption on phones; the header wraps |
| "Coming soon" badges broke the tile grid | Upcoming tiles stack the badge at the bottom; empty phases show only a header |
| Level 1 template code in Java was a bare method | Every Java sample is a complete `Solution` class |

## Not done

- **Live Java check (T-402):** waits for `JUDGE0_API_KEY` on Render.
- **PO content review of Levels 1–3 (T-415).**
- Profile page design pass (T-414).
- Real-grader latency check (NFR-04), carried from Sprint 3.

## Next sprint

Sprint 5 proposal follows: the live Java check, the Levels 1–3 content review, and the next levels from the new curriculum (T-502), about two per sprint.

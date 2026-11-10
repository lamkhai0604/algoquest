# Sprint 3 Report — Levels 1–3 Test Build

| Field | Value |
| --- | --- |
| Sprint | Sprint 3 ([plan](../sprints/sprint-3.md)) |
| Dates | 2026-11-09 |
| Goal | A player can finish Level 1 completely: use hints, do the practice round, pass the level-up test, and continue into Levels 2 and 3 |
| Outcome | **Goal met in CI with the fake grader.** T-301 to T-306 and T-308 are implemented, verified, and merged. T-307 (first deployment) waits for a separate PO approval. Open: PO review of the Levels 2 and 3 content |

## Increment

- Hints: 3 per problem, at most 3 in any 5 hours, each lowering that problem's XP by 20%; hint count in the header; VIP placeholder page.
- Practice round at 70% of the bar: a solved problem explained again without hints is marked Done for up to 10 XP.
- Level-up test at a full bar: 3 problems, a 2-hour clock owned by the server, autosave, automatic submit at time-up, retakes, best score kept; 70–99 opens the next level's Easy problems and 100 opens all of it.
- Time bonus measured from the server's first-opening time, not the page timer.
- Levels 2 (Arrays & Hashing) and 3 (Two Pointers): lessons, walkthroughs, quick checks, 6 practice and 3 test problems each.
- Profile with totals, streak (calendar days in the player's time zone), and progress per level; main navigation.
- Admin panel: grading log with a problem filter; users and roles; progress reset per level with a confirmation step and an audit entry.

## Results by task

| Task | Implemented | Verified | Merged to `dev` |
| --- | --- | --- | --- |
| T-301 Hints | `hint_use`, hint and quota endpoints, hint panel, VIP page | Quota with a movable clock, order, per-problem limit, XP reduction; smoke uses a hint | Yes |
| T-302 Practice round | Practice attempts, Done flag, practice XP capped at the bar | Gate, solved-only, once per problem, cap, low score | Yes |
| T-303 Level-up test | Tests, answers, server clock, unlock states, retakes; server-side time bonus | Gate, unlock states, retakes, time-up, grader failure, idempotent submit, access | Yes |
| T-304 Levels 2 and 3 content | Lessons and 18 problems with placeholders | Content validation in CI; hidden test answers computed by reference solutions | Yes; **PO content review open** |
| T-305 Profile and streak | `streak`, profile endpoint and page, header streak, navigation | Streak rules, time-zone day boundaries | Yes |
| T-306 Admin panel part 1 | Grading log, progress reset, admin page | Reset effects, audit entry, 403 for players | Yes |
| T-307 First deployment | Not started | — | **Waiting for PO approval** (D-037, D-006) |
| T-308 Sprint report | This document | Records check | Yes |

Review: all tasks are self-reviewed. The PO reviews the `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 160 tests, 0 failed; formatting clean; Docker image builds |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | 5 passed, including a hint in the Level 1 flow |
| Local development job | Backend healthy following the README steps |
| Records check | OK |

## Decisions and interpretations

- **Hint quota window:** each hint comes back 5 hours after it was opened (a rolling window).
- **Practice "without hints":** the practice page hides hints; a score of 70 or more marks the problem Done directly, without a separate Done click.
- **Test time-up:** the server stops accepting answers at the end time; the page submits by itself, and a later submit grades what was saved.
- **Time bonus:** measured from the first time the player opened the problem, recorded by the server.
- **Progress reset:** removes the level's progress, hint use, start times, and tests; the grading log keeps the attempts.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| A shared test clock changed by one test affected another | Each test sets the clock before it runs |
| Formatter diffs split inside a multi-byte character could not be applied | CI splits failure details by line |
| React lint rules forbid reading the clock or refs during render | The test countdown reads the clock only inside an effect |

## Not done

- **T-307 first deployment** — needs PO approval, accounts on Vercel and Render, and production OAuth apps.
- **PO review of Levels 2 and 3 content.**
- Real-grader check (NFR-04) and manual sign-in check, open since Sprints 1 and 2.

## Next sprint

Sprint 4 — code answers for double XP (JavaScript in the browser, Java on Judge0), admin game config, and polish. The plan is proposed after the PO decides on T-307.

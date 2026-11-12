# Sprint 3 Report — Levels 1–3 Test Build

| Field | Value |
| --- | --- |
| Sprint | Sprint 3 ([plan](../sprints/sprint-3.md)) |
| Dates | 2026-11-09 to 2026-11-12 |
| Goal | A player can finish Level 1 completely: use hints, do the practice round, pass the level-up test, and continue into Levels 2 and 3 |
| Outcome | **Goal met; sprint closed 2026-11-12.** T-301 to T-311 are done. The game runs on the live site (T-307), the PO played Level 1 there, and the feedback round (T-309 to T-311) is merged. Open: PO review of the Levels 2 and 3 content |

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
| T-307 First deployment | Vercel, Render, Neon; production OAuth apps; [runbook](../DEPLOY.md) | Live health check; PO signed in and had an answer graded by Gemini on the live site | Yes |
| T-308 Sprint report | This document | Records check | Yes |
| T-309 Trial feedback round | XP rebalance, quick check XP, ordered problems, result page, active-time clock, scoring guide | Backend and frontend tests; smoke | Yes |
| T-310 Solve page layout | Full-width answer; answer beside the result; no re-lock after an order change | Tests; smoke | Yes |
| T-311 Sign-in background | Live graph search (D-045) | Frontend checks | Yes |

Review: all tasks are self-reviewed. The PO reviews the `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 160 tests, 0 failed; formatting clean; Docker image builds |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | 5 passed, including a hint in the Level 1 flow |
| Local development job | Backend healthy following the README steps |
| Records check | OK |

## Trial feedback round (T-309)

After the first deployment the PO played Level 1 and reported issues. Each change was approved item by item and recorded as D-040 to D-044:

| Area | Change |
| --- | --- |
| XP | A full pass through a level fills the bar: Easy 20, Medium 29, quick check 5, target 150 (D-040) |
| Lesson | The quick check is stored and awards 5 XP once (D-041) |
| Problems | Problems open in order at a score of 70; a graded problem reopens on its result with Back, Retry (confirmed), and Next; confetti at 100 (D-042) |
| Time | The time bonus counts active working time from heartbeats; leaving pauses the clock; Continue or Start again on return; a muted clock and a note after the limit; Paused tag (D-043) |
| Guidance | A scoring guide under the solve and test pages; the profile lists only levels the player can open (D-044) |
| Interface | Round back button on every page, 24 px theme icon, "Coming soon" wording |

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

- **PO review of Levels 2 and 3 content.**
- Real-grader latency check (NFR-04): the live site grades with Gemini; a measured run of `RealGraderCheck` is still open.

## Next sprint

Sprint 4 — code answers for double XP (JavaScript in the browser, Java on Judge0), admin game config, and polish. The plan is proposed next.

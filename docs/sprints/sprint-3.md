# Sprint 3 — Levels 1–3 Test Build

| Field | Value |
| --- | --- |
| Status | **Proposed** — starts when the PO approves this plan |
| Goal | A player can finish Level 1 completely: use hints, do the practice round, pass the level-up test, and continue into Levels 2 and 3. |
| Duration | About 1 to 2 weeks from approval |
| Tasks | T-301 to T-308 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-06, FR-09, FR-10, FR-12, FR-13, FR-18.1, FR-18.2; decisions D-015 to D-018, D-037 |

## Increment at the end of the sprint

- Hints on the solve page: 3 per problem, at most 3 every 5 hours, each one lowering that problem's XP by 20%; the header shows the hints left.
- Practice round at 70% of the level bar: solve a solved problem again without hints, mark it Done for +10 XP, until the bar is full.
- Level-up test at a full bar: 3 new problems with a countdown; a score of 70 to 99 opens the next level's Easy problems, 100 opens the whole level; retakes are always allowed.
- Levels 2 (Arrays & Hashing) and 3 (Two Pointers) with lessons and problems.
- Profile page with total XP, level progress, best test scores, and the daily streak.
- Admin pages for the Owner: grading log and progress reset, both audit-logged.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-301 Hints | `hint_use` table; `POST /problems/{id}/hints`, `GET /hints/quota`; quota of 3 per rolling 5 hours; hints used are counted by the server and passed to the XP rules; hint panel and header counter; VIP link to a placeholder page | A fourth hint within 5 hours is refused with the refill time; XP is reduced by 20% per hint (tests); a hint text is sent only when the player asks for it | CI; smoke; screenshots |
| 2 | T-302 Practice round | Opens at 70%; lists solved problems; a new solve without hints enables Done; +10 XP per problem once, never past a full bar | Rules covered by API tests; closed below 70% | CI; smoke |
| 3 | T-303 Level-up test | `level_progress` and `test_attempt` tables; start, answer, and submit endpoints; **server-side timer**; score = average rounded down; unanswered problems score 0 at timeout; unlock states; retakes; best score kept. The solve-page time bonus also moves to a server-side start time | A level never goes back from Open; test problems are served only inside a running test; timeout grades the test (tests with a movable clock) | CI; smoke; screenshots |
| 4 | T-304 Levels 2 and 3 content | For each level: lesson, walkthrough, quick check, 3 Easy + 3 Medium practice problems, 3 test problems, Hard placeholders. The four grading-test problems for these levels are reused | Passes validation; reviewed by the PO in a pull request | CI; PO review |
| 5 | T-305 Profile and streak | `streak` table; a day counts when a problem is solved or marked Done; profile page; streak in the header | Streak rules tested with a movable clock, including a missed day | CI; screenshots |
| 6 | T-306 Admin panel part 1 | Owner pages: grading log (attempts with scores and feedback) and progress reset for one user, written to the audit log | Player gets 403; reset is audit-logged with before and after values (tests) | CI; smoke |
| 7 | T-307 First deployment | Vercel (frontend), Render (backend), Neon (database), production OAuth apps, live smoke check | **Starts only after a separate PO approval** (D-037, D-006); free tiers only | Live smoke check |
| 8 | T-308 Sprint 3 report | `docs/reports/sprint-3-report.md` | Implemented, verified, reviewed, merged listed separately | — |

Code answers for double XP (FR-07) stay in Sprint 4.

## Work for the PO

- Before the sprint: run the real-grader check from Sprint 2 (README, "Checks"), so grading latency (NFR-04) is known before the timed test is built.
- Review the Levels 2 and 3 content (T-304).
- Decide on T-307 (first deployment) when the rest of the sprint is done; it needs accounts on Vercel and Render and production OAuth apps.

## Risks

| Risk | Mitigation |
| --- | --- |
| The Gemini free quota (about 500 gradings a day, 10 a minute) is used up by a test with 3 problems plus practice | Test answers are graded once at submit; the failure path keeps answers and allows a later submit |
| Timer disputes (page closed, slow network) | The server owns the start and end times; answers are saved as they are written |
| Content for two levels takes longer than the code | Content is drafted first and reviewed in parallel; the sprint can close with Level 2 only and move Level 3 to Sprint 4 |
| Deployment needs paid features | Stop and ask; free tiers only (D-006) |

## Sprint review

Written at the end of the sprint in `docs/reports/sprint-3-report.md` (D-007).

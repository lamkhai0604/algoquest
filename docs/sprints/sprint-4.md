# Sprint 4 — Code and Rules

| Field | Value |
| --- | --- |
| Status | **Approved — PO, 2026-11-12** |
| Goal | After a passing explanation, a player can write code in JavaScript or Java and double the problem's XP; the Owner can tune the game rules without a deployment; the rules and code flow are finished as the template for later levels. |
| Duration | About 1 to 2 weeks from approval |
| Tasks | T-401, T-402, T-404 to T-408 ([BACKLOG.md](../BACKLOG.md)); T-403 moves to Later |
| Requirements | FR-07, FR-11 (placeholder), FR-16 (placeholder), FR-17.6, FR-18.3, FR-18.4, NFR-04, NFR-09; decisions D-032, D-035, D-046, D-047 |

## Increment at the end of the sprint

- A solved problem offers **Code it for 2× XP**: the player writes JavaScript or Java in an in-page editor, runs the hidden tests, and sees passed/total and the first failing input. All tests passing doubles the problem's XP once.
- JavaScript runs in the browser in a Web Worker with a 5-second limit; the browser receives only test inputs, and the server compares the outputs (D-035).
- Java runs on Judge0 through the free plan, with a daily quota guard and a clear message when the quota is used up (D-032).
- The Owner edits the game rules (XP values, time limits, hint quota, pass mark, level target) on an admin page; changes apply without a deployment and are audit-logged.
- Admin pages for users and roles and for the audit log.
- Placeholders for Hard mode and Battle mode; a design pass from mockups the PO selects.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-401 Code editor and JavaScript runner | In-page editor without a library (line numbers, Tab, monospace, basic highlighting) (D-046); test inputs endpoint; Web Worker runner; `POST /problems/{id}/code`; code bonus once | Expected outputs never reach the browser; a wrong or timed-out run awards nothing; the bonus is given once (tests) | CI; smoke; screenshots |
| 2 | T-402 Java runner on Judge0 | `CodeRunner` interface, Judge0 client with a timeout, a generated test harness from the starter signature, daily quota guard, fake runner for tests | Quota reached → clear message, JavaScript still works; Judge0 errors do not lose XP (tests with a fake runner) | CI; live check by the PO with the Judge0 key |
| 3 | T-405 Admin panel part 2 | `game_config` stored in the database and read at runtime (D-047); config editor; users and roles page; audit log view | Changes apply on the next request and are audit-logged with before and after values; players get 403 | CI; screenshots |
| 4 | T-407 XP tuning | Default values unchanged (D-040); the PO tunes them on the config page after each trial | Config limits reject values that break the rules (for example a pass mark above 100) | CI |
| 5 | T-404 Placeholders | Hard mode and Battle mode placeholders, labelled "Coming soon" | No action is possible from a placeholder | Screenshots |
| 6 | T-406 Design pass | Mockups of the level map, profile, and phone layouts first; the PO selects; then apply | PO selection recorded | Screenshots |
| 7 | T-408 Sprint 4 report | `docs/reports/sprint-4-report.md` | Implemented, verified, reviewed, merged listed separately | — |

Out of scope: the demo leaderboard (T-403, moved to Later) and new level content (T-502, from Sprint 5).

## Work for the PO

- Add `JUDGE0_API_KEY` (RapidAPI) to the Render environment before the live Java check (T-402). The free Basic plan needs no payment method.
- Select a design direction from the T-406 mockups.
